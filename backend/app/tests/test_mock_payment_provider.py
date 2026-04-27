import json
from decimal import Decimal
from uuid import uuid4

import pytest

from app.services.payments import (
    MockPaymentProvider,
    PaymentInitiationRequest,
    PaymentProviderError,
    VerifiedWebhook,
    WebhookVerificationRequest,
    create_default_payment_provider_registry,
)


def test_mock_provider_initiates_deterministic_payment_action() -> None:
    provider = MockPaymentProvider()
    order_id = uuid4()

    result = provider.initiate_payment(
        PaymentInitiationRequest(
            order_id=order_id,
            order_code="ORD-100",
            amount=Decimal("250000.00"),
            currency_code="VND",
            method_code="mock_card",
            customer_email="buyer@example.com",
            customer_phone="0900000000",
            return_url="https://shop.example/checkout/success?order_code=ORD-100",
        )
    )

    assert result.provider_code == "mock"
    assert result.method_code == "mock_card"
    assert result.status == "pending"
    assert result.amount == Decimal("250000.00")
    assert result.transaction_reference == "mock-ORD-100"
    assert result.action_url == "https://shop.example/checkout/success?order_code=ORD-100"
    assert result.provider_payload["order_id"] == str(order_id)
    assert result.provider_payload["transaction_reference"] == "mock-ORD-100"


def test_mock_provider_verifies_signed_webhook_and_normalizes_event() -> None:
    provider = MockPaymentProvider()
    payload = {
        "provider_event_id": "mock_evt_1",
        "event_type": "payment.succeeded",
        "transaction_reference": "mock-ORD-100",
        "order_code": "ORD-100",
        "status": "paid",
        "amount": "250000.00",
        "currency_code": "VND",
    }

    webhook = provider.verify_webhook(
        WebhookVerificationRequest(
            headers={"x-mock-payment-signature": "mock-valid-signature"},
            raw_body=json.dumps(payload).encode("utf-8"),
        )
    )
    normalized_event = provider.normalize_event(webhook)

    assert webhook.provider_code == "mock"
    assert webhook.provider_event_id == "mock_evt_1"
    assert webhook.event_type == "payment.succeeded"
    assert normalized_event.transaction_reference == "mock-ORD-100"
    assert normalized_event.order_code == "ORD-100"
    assert normalized_event.status == "paid"
    assert normalized_event.amount == Decimal("250000.00")
    assert normalized_event.currency_code == "VND"
    assert normalized_event.payload == payload


def test_mock_provider_rejects_invalid_signature() -> None:
    provider = MockPaymentProvider()

    with pytest.raises(PaymentProviderError) as exc_info:
        provider.verify_webhook(WebhookVerificationRequest(headers={}, raw_body=b"{}"))

    assert exc_info.value.code == "PAYMENT_WEBHOOK_INVALID"


def test_mock_provider_rejects_invalid_payload() -> None:
    provider = MockPaymentProvider()

    with pytest.raises(PaymentProviderError) as exc_info:
        provider.verify_webhook(
            WebhookVerificationRequest(
                headers={"x-mock-payment-signature": "mock-valid-signature"},
                raw_body=b"not-json",
            )
        )

    assert exc_info.value.code == "PAYMENT_WEBHOOK_INVALID_PAYLOAD"


def test_mock_provider_rejects_mismatched_provider_event() -> None:
    provider = MockPaymentProvider()

    with pytest.raises(PaymentProviderError) as exc_info:
        provider.normalize_event(
            VerifiedWebhook(
                provider_code="other",
                provider_event_id="evt_1",
                event_type="payment.succeeded",
                payload={},
            )
        )

    assert exc_info.value.code == "PAYMENT_PROVIDER_MISMATCH"


def test_default_provider_registry_contains_mock_provider() -> None:
    registry = create_default_payment_provider_registry()

    assert registry.list_provider_codes() == ["mock"]
    assert isinstance(registry.get("mock"), MockPaymentProvider)
