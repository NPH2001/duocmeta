from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.commerce import Order, Payment, PaymentEvent


@pytest.fixture()
def client_with_session() -> Generator[tuple[TestClient, sessionmaker[Session]], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    def override_db_session() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db_session

    with TestClient(app) as test_client:
        yield test_client, session_factory

    app.dependency_overrides.pop(get_db_session, None)
    Base.metadata.drop_all(engine)


def test_payment_webhook_updates_payment_and_order_status(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order_with_payment(session, order_code="ORD-WEBHOOK-1")

    response = client.post(
        "/api/v1/payments/webhooks/mock",
        headers={"x-mock-payment-signature": "mock-valid-signature"},
        content=json.dumps(
            {
                "provider_event_id": "mock_evt_paid_1",
                "event_type": "payment.succeeded",
                "transaction_reference": "mock-ORD-WEBHOOK-1",
                "order_code": "ORD-WEBHOOK-1",
                "status": "paid",
                "amount": "100000.00",
                "currency_code": "VND",
            }
        ),
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["provider_code"] == "mock"
    assert data["provider_event_id"] == "mock_evt_paid_1"
    assert data["payment_status"] == "paid"
    assert data["order_code"] == "ORD-WEBHOOK-1"
    assert data["order_status"] == "paid"
    assert data["processed"] is True

    with session_factory() as session:
        payment = session.scalar(select(Payment))
        order = session.scalar(select(Order))
        event = session.scalar(select(PaymentEvent))

    assert payment.status == "paid"
    assert payment.paid_at is not None
    assert order.payment_status == "paid"
    assert order.status == "paid"
    assert event.provider_event_id == "mock_evt_paid_1"
    assert event.payload["transaction_reference"] == "mock-ORD-WEBHOOK-1"


def test_payment_webhook_duplicate_event_is_idempotent(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order_with_payment(session, order_code="ORD-WEBHOOK-2")

    payload = {
        "provider_event_id": "mock_evt_paid_2",
        "event_type": "payment.succeeded",
        "transaction_reference": "mock-ORD-WEBHOOK-2",
        "order_code": "ORD-WEBHOOK-2",
        "status": "paid",
        "amount": "100000.00",
        "currency_code": "VND",
    }
    first_response = _post_mock_webhook(client, payload)
    retry_response = _post_mock_webhook(client, payload)

    assert first_response.status_code == 200
    assert retry_response.status_code == 200
    assert retry_response.json()["data"]["processed"] is False

    with session_factory() as session:
        event_count = len(session.scalars(select(PaymentEvent)).all())

    assert event_count == 1


def test_payment_webhook_rejects_invalid_signature(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order_with_payment(session, order_code="ORD-WEBHOOK-3")

    response = client.post(
        "/api/v1/payments/webhooks/mock",
        headers={"x-mock-payment-signature": "bad-signature"},
        content=json.dumps({"provider_event_id": "mock_evt_bad"}),
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "PAYMENT_WEBHOOK_INVALID"

    with session_factory() as session:
        event_count = len(session.scalars(select(PaymentEvent)).all())

    assert event_count == 0


def test_payment_webhook_rejects_unknown_payment_reference(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, _ = client_with_session

    response = _post_mock_webhook(
        client,
        {
            "provider_event_id": "mock_evt_missing",
            "event_type": "payment.succeeded",
            "transaction_reference": "mock-missing",
            "status": "paid",
        },
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PAYMENT_NOT_FOUND"


def _post_mock_webhook(client: TestClient, payload: dict[str, object]):
    return client.post(
        "/api/v1/payments/webhooks/mock",
        headers={"x-mock-payment-signature": "mock-valid-signature"},
        content=json.dumps(payload),
    )


def _seed_order_with_payment(session: Session, *, order_code: str) -> None:
    order = Order(
        order_code=order_code,
        idempotency_key=f"idempotency-{order_code}",
        email="buyer@example.com",
        phone="0900000000",
        status="pending_payment",
        payment_status="pending",
        fulfillment_status="unfulfilled",
        currency_code="VND",
        subtotal_amount=Decimal("100000.00"),
        discount_amount=Decimal("0.00"),
        shipping_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        grand_total_amount=Decimal("100000.00"),
        placed_at=datetime.now(UTC),
    )
    session.add(order)
    session.flush()
    session.add(
        Payment(
            order_id=order.id,
            provider_code="mock",
            method_code="mock_card",
            status="pending",
            amount=Decimal("100000.00"),
            transaction_reference=f"mock-{order_code}",
            provider_payload={"transaction_reference": f"mock-{order_code}"},
        )
    )
    session.commit()
