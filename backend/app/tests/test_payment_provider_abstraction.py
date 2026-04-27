from decimal import Decimal
from uuid import uuid4

import pytest

from app.services.payments import (
    NormalizedPaymentEvent,
    PaymentInitiationRequest,
    PaymentInitiationResult,
    PaymentProviderRegistry,
    PaymentProviderError,
    VerifiedWebhook,
    WebhookVerificationRequest,
)


class FakeProvider:
    provider_code = "fake"

    def initiate_payment(self, request: PaymentInitiationRequest) -> PaymentInitiationResult:
        return PaymentInitiationResult(
            provider_code=self.provider_code,
            method_code=request.method_code,
            status="pending",
            amount=request.amount,
            transaction_reference=f"fake-{request.order_code}",
            action_url="https://payments.example/continue",
            provider_payload={"order_code": request.order_code},
        )

    def verify_webhook(self, request: WebhookVerificationRequest) -> VerifiedWebhook:
        signature = request.headers.get("x-fake-signature")
        if signature != "valid":
            raise PaymentProviderError("PAYMENT_WEBHOOK_INVALID", "Webhook signature is invalid.")

        return VerifiedWebhook(
            provider_code=self.provider_code,
            provider_event_id="evt_1",
            event_type="payment.succeeded",
            payload={"transaction_reference": "fake-ORD-1", "status": "paid"},
        )

    def normalize_event(self, webhook: VerifiedWebhook) -> NormalizedPaymentEvent:
        return NormalizedPaymentEvent(
            provider_code=webhook.provider_code,
            provider_event_id=webhook.provider_event_id,
            event_type=webhook.event_type,
            transaction_reference=str(webhook.payload["transaction_reference"]),
            order_code="ORD-1",
            status=str(webhook.payload["status"]),
            amount=Decimal("100000.00"),
            currency_code="VND",
            payload=webhook.payload,
        )


def test_provider_contract_initiates_payment_action_data() -> None:
    provider = FakeProvider()
    order_id = uuid4()

    result = provider.initiate_payment(
        PaymentInitiationRequest(
            order_id=order_id,
            order_code="ORD-1",
            amount=Decimal("100000.00"),
            currency_code="VND",
            method_code="cod",
            customer_email="buyer@example.com",
            customer_phone="0900000000",
        )
    )

    assert result.provider_code == "fake"
    assert result.method_code == "cod"
    assert result.status == "pending"
    assert result.amount == Decimal("100000.00")
    assert result.transaction_reference == "fake-ORD-1"
    assert result.provider_payload == {"order_code": "ORD-1"}


def test_provider_owns_webhook_verification_and_normalization() -> None:
    provider = FakeProvider()

    webhook = provider.verify_webhook(
        WebhookVerificationRequest(headers={"x-fake-signature": "valid"}, raw_body=b"{}")
    )
    normalized_event = provider.normalize_event(webhook)

    assert webhook.provider_event_id == "evt_1"
    assert normalized_event.provider_code == "fake"
    assert normalized_event.transaction_reference == "fake-ORD-1"
    assert normalized_event.status == "paid"
    assert normalized_event.payload == webhook.payload


def test_provider_rejects_invalid_webhook_signature() -> None:
    provider = FakeProvider()

    with pytest.raises(PaymentProviderError) as exc_info:
        provider.verify_webhook(WebhookVerificationRequest(headers={}, raw_body=b"{}"))

    assert exc_info.value.code == "PAYMENT_WEBHOOK_INVALID"


def test_provider_registry_returns_registered_provider() -> None:
    registry = PaymentProviderRegistry()
    provider = FakeProvider()

    registry.register(provider)

    assert registry.get("fake") is provider
    assert registry.list_provider_codes() == ["fake"]


def test_provider_registry_rejects_duplicates_and_unknown_codes() -> None:
    registry = PaymentProviderRegistry()
    registry.register(FakeProvider())

    with pytest.raises(PaymentProviderError) as duplicate_error:
        registry.register(FakeProvider())

    with pytest.raises(PaymentProviderError) as missing_error:
        registry.get("missing")

    assert duplicate_error.value.code == "PAYMENT_PROVIDER_ALREADY_REGISTERED"
    assert missing_error.value.code == "PAYMENT_PROVIDER_NOT_FOUND"
