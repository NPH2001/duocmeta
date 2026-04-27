from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from http import HTTPStatus
import json
from typing import Protocol
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.commerce import Order, Payment, PaymentEvent
from app.repositories.payments import PaymentRepository
from app.schemas.payments import PaymentInitiateResponse, PaymentWebhookResponse


class PaymentProviderError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


class PaymentServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class PaymentInitiationRequest:
    order_id: UUID
    order_code: str
    amount: Decimal
    currency_code: str
    method_code: str
    customer_email: str
    customer_phone: str
    return_url: str | None = None
    cancel_url: str | None = None


@dataclass(frozen=True)
class PaymentInitiationResult:
    provider_code: str
    method_code: str
    status: str
    amount: Decimal
    transaction_reference: str | None
    action_url: str | None
    provider_payload: dict[str, object]


@dataclass(frozen=True)
class WebhookVerificationRequest:
    headers: dict[str, str]
    raw_body: bytes
    query_params: dict[str, str] | None = None


@dataclass(frozen=True)
class VerifiedWebhook:
    provider_code: str
    provider_event_id: str | None
    event_type: str
    payload: dict[str, object]


@dataclass(frozen=True)
class NormalizedPaymentEvent:
    provider_code: str
    provider_event_id: str | None
    event_type: str
    transaction_reference: str | None
    order_code: str | None
    status: str
    amount: Decimal | None
    currency_code: str | None
    payload: dict[str, object]


class PaymentProvider(Protocol):
    provider_code: str

    def initiate_payment(self, request: PaymentInitiationRequest) -> PaymentInitiationResult:
        """Create provider-side payment action data without mutating local order state."""

    def verify_webhook(self, request: WebhookVerificationRequest) -> VerifiedWebhook:
        """Verify provider webhook authenticity before any event processing."""

    def normalize_event(self, webhook: VerifiedWebhook) -> NormalizedPaymentEvent:
        """Convert a provider webhook into the platform payment event contract."""


class PaymentProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, PaymentProvider] = {}

    def register(self, provider: PaymentProvider) -> None:
        if provider.provider_code in self._providers:
            raise PaymentProviderError(
                "PAYMENT_PROVIDER_ALREADY_REGISTERED",
                f"Payment provider '{provider.provider_code}' is already registered.",
            )

        self._providers[provider.provider_code] = provider

    def get(self, provider_code: str) -> PaymentProvider:
        provider = self._providers.get(provider_code)
        if provider is None:
            raise PaymentProviderError(
                "PAYMENT_PROVIDER_NOT_FOUND",
                f"Payment provider '{provider_code}' was not found.",
            )

        return provider

    def list_provider_codes(self) -> list[str]:
        return sorted(self._providers)


class MockPaymentProvider:
    provider_code = "mock"
    webhook_signature_header = "x-mock-payment-signature"
    webhook_signature = "mock-valid-signature"

    def initiate_payment(self, request: PaymentInitiationRequest) -> PaymentInitiationResult:
        transaction_reference = f"mock-{request.order_code}"

        return PaymentInitiationResult(
            provider_code=self.provider_code,
            method_code=request.method_code,
            status="pending",
            amount=request.amount,
            transaction_reference=transaction_reference,
            action_url=request.return_url,
            provider_payload={
                "provider": self.provider_code,
                "order_id": str(request.order_id),
                "order_code": request.order_code,
                "transaction_reference": transaction_reference,
                "amount": str(request.amount),
                "currency_code": request.currency_code,
                "method_code": request.method_code,
                "action_url": request.return_url,
                "cancel_url": request.cancel_url,
            },
        )

    def verify_webhook(self, request: WebhookVerificationRequest) -> VerifiedWebhook:
        signature = request.headers.get(self.webhook_signature_header)
        if signature != self.webhook_signature:
            raise PaymentProviderError("PAYMENT_WEBHOOK_INVALID", "Mock webhook signature is invalid.")

        try:
            payload = json.loads(request.raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise PaymentProviderError("PAYMENT_WEBHOOK_INVALID_PAYLOAD", "Mock webhook payload is invalid.") from exc

        if not isinstance(payload, dict):
            raise PaymentProviderError("PAYMENT_WEBHOOK_INVALID_PAYLOAD", "Mock webhook payload must be an object.")

        event_type = _string_payload_value(payload, "event_type") or "payment.updated"
        provider_event_id = _string_payload_value(payload, "provider_event_id")

        return VerifiedWebhook(
            provider_code=self.provider_code,
            provider_event_id=provider_event_id,
            event_type=event_type,
            payload=payload,
        )

    def normalize_event(self, webhook: VerifiedWebhook) -> NormalizedPaymentEvent:
        if webhook.provider_code != self.provider_code:
            raise PaymentProviderError("PAYMENT_PROVIDER_MISMATCH", "Webhook provider does not match mock provider.")

        amount = _decimal_payload_value(webhook.payload, "amount")

        return NormalizedPaymentEvent(
            provider_code=self.provider_code,
            provider_event_id=webhook.provider_event_id,
            event_type=webhook.event_type,
            transaction_reference=_string_payload_value(webhook.payload, "transaction_reference"),
            order_code=_string_payload_value(webhook.payload, "order_code"),
            status=_string_payload_value(webhook.payload, "status") or "pending",
            amount=amount,
            currency_code=_string_payload_value(webhook.payload, "currency_code"),
            payload=webhook.payload,
        )


def create_default_payment_provider_registry() -> PaymentProviderRegistry:
    registry = PaymentProviderRegistry()
    registry.register(MockPaymentProvider())
    return registry


class PaymentService:
    def __init__(
        self,
        session: Session,
        provider_registry: PaymentProviderRegistry | None = None,
    ) -> None:
        self.repository = PaymentRepository(session)
        self.provider_registry = provider_registry or create_default_payment_provider_registry()
        self.session = session

    def initiate_payment(
        self,
        *,
        order_code: str,
        provider_code: str,
        method_code: str,
        return_url: str | None,
        cancel_url: str | None,
    ) -> tuple[PaymentInitiateResponse, bool]:
        order = self.repository.get_order_by_code(order_code)
        if order is None:
            raise PaymentServiceError("ORDER_NOT_FOUND", "Order was not found.", HTTPStatus.NOT_FOUND)

        if order.payment is not None:
            return _payment_response(order, order.payment), False

        if order.status != "pending_payment" or order.payment_status != "pending":
            raise PaymentServiceError(
                "ORDER_NOT_PAYABLE",
                "Order is not payable.",
                HTTPStatus.CONFLICT,
            )

        try:
            provider = self.provider_registry.get(provider_code)
            initiation_result = provider.initiate_payment(
                PaymentInitiationRequest(
                    order_id=order.id,
                    order_code=order.order_code,
                    amount=order.grand_total_amount,
                    currency_code=order.currency_code,
                    method_code=method_code,
                    customer_email=order.email,
                    customer_phone=order.phone,
                    return_url=return_url,
                    cancel_url=cancel_url,
                )
            )
        except PaymentProviderError as exc:
            raise PaymentServiceError(exc.code, exc.message, HTTPStatus.BAD_REQUEST) from exc

        payment = self.repository.add_payment(
            Payment(
                order_id=order.id,
                provider_code=initiation_result.provider_code,
                method_code=initiation_result.method_code,
                status=initiation_result.status,
                amount=order.grand_total_amount,
                transaction_reference=initiation_result.transaction_reference,
                provider_payload=initiation_result.provider_payload,
            )
        )
        self.session.commit()
        return _payment_response(order, payment), True

    def handle_webhook(
        self,
        *,
        provider_code: str,
        headers: dict[str, str],
        raw_body: bytes,
        query_params: dict[str, str] | None = None,
    ) -> PaymentWebhookResponse:
        try:
            provider = self.provider_registry.get(provider_code)
            verified_webhook = provider.verify_webhook(
                WebhookVerificationRequest(
                    headers=headers,
                    raw_body=raw_body,
                    query_params=query_params,
                )
            )
            normalized_event = provider.normalize_event(verified_webhook)
        except PaymentProviderError as exc:
            raise PaymentServiceError(exc.code, exc.message, HTTPStatus.BAD_REQUEST) from exc

        if normalized_event.provider_code != provider_code:
            raise PaymentServiceError(
                "PAYMENT_PROVIDER_MISMATCH",
                "Webhook provider does not match request provider.",
                HTTPStatus.BAD_REQUEST,
            )

        if not normalized_event.provider_event_id:
            raise PaymentServiceError(
                "PAYMENT_EVENT_ID_REQUIRED",
                "Provider event id is required for idempotent webhook processing.",
                HTTPStatus.BAD_REQUEST,
            )

        existing_event = self.repository.get_payment_event_by_provider_event_id(
            normalized_event.provider_event_id,
            provider_code,
        )
        if existing_event is not None:
            return _webhook_response(existing_event.payment, existing_event, processed=False)

        payment = self._find_payment_for_event(normalized_event)
        payment_event = self.repository.add_payment_event(
            PaymentEvent(
                payment_id=payment.id,
                event_type=normalized_event.event_type,
                provider_event_id=normalized_event.provider_event_id,
                payload=normalized_event.payload,
            )
        )
        self._apply_payment_status(payment, normalized_event.status)
        self.session.commit()
        return _webhook_response(payment, payment_event, processed=True)

    def _find_payment_for_event(self, event: NormalizedPaymentEvent) -> Payment:
        if event.transaction_reference:
            payment = self.repository.get_payment_by_provider_reference(
                event.provider_code,
                event.transaction_reference,
            )
            if payment is not None:
                return payment

        raise PaymentServiceError("PAYMENT_NOT_FOUND", "Payment was not found.", HTTPStatus.NOT_FOUND)

    def _apply_payment_status(self, payment: Payment, status: str) -> None:
        payment.status = status
        payment.order.payment_status = status

        if status == "paid":
            paid_at = datetime.now(UTC)
            payment.paid_at = paid_at
            payment.order.status = "paid"
        elif status == "failed":
            failed_at = datetime.now(UTC)
            payment.failed_at = failed_at
            payment.order.status = "payment_failed"


def _string_payload_value(payload: dict[str, object], key: str) -> str | None:
    value = payload.get(key)
    if value is None:
        return None

    return str(value)


def _decimal_payload_value(payload: dict[str, object], key: str) -> Decimal | None:
    value = payload.get(key)
    if value is None:
        return None

    try:
        return Decimal(str(value))
    except Exception as exc:
        raise PaymentProviderError("PAYMENT_WEBHOOK_INVALID_PAYLOAD", f"Mock webhook '{key}' is invalid.") from exc


def _payment_response(order: Order, payment: Payment) -> PaymentInitiateResponse:
    provider_payload = payment.provider_payload or {}

    return PaymentInitiateResponse(
        id=payment.id,
        order_code=order.order_code,
        provider_code=payment.provider_code,
        method_code=payment.method_code,
        status=payment.status,
        amount=payment.amount,
        transaction_reference=payment.transaction_reference,
        action_url=_optional_string(provider_payload.get("action_url")),
        provider_payload=provider_payload,
    )


def _optional_string(value: object) -> str | None:
    if value is None:
        return None

    return str(value)


def _webhook_response(payment: Payment, payment_event: PaymentEvent, *, processed: bool) -> PaymentWebhookResponse:
    provider_event_id = payment_event.provider_event_id
    if provider_event_id is None:
        raise PaymentServiceError(
            "PAYMENT_EVENT_ID_REQUIRED",
            "Provider event id is required for idempotent webhook processing.",
            HTTPStatus.BAD_REQUEST,
        )

    return PaymentWebhookResponse(
        provider_code=payment.provider_code,
        provider_event_id=provider_event_id,
        event_type=payment_event.event_type,
        payment_status=payment.status,
        order_code=payment.order.order_code,
        order_status=payment.order.status,
        processed=processed,
    )
