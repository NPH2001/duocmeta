from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.commerce import Order, Payment


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


def test_payment_initiation_creates_payment_from_backend_order_total(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order(session, order_code="ORD-PAY-1", grand_total_amount=Decimal("300000.00"))

    response = client.post(
        "/api/v1/payments/ORD-PAY-1/initiate",
        json={
            "provider_code": "mock",
            "method_code": "mock_card",
            "return_url": "https://shop.example/checkout/success?order_code=ORD-PAY-1",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["order_code"] == "ORD-PAY-1"
    assert data["provider_code"] == "mock"
    assert data["method_code"] == "mock_card"
    assert data["status"] == "pending"
    assert data["amount"] == "300000.00"
    assert data["transaction_reference"] == "mock-ORD-PAY-1"
    assert data["action_url"] == "https://shop.example/checkout/success?order_code=ORD-PAY-1"

    with session_factory() as session:
        payment = session.scalar(select(Payment))

    assert payment.amount == Decimal("300000.00")
    assert payment.provider_payload["transaction_reference"] == "mock-ORD-PAY-1"


def test_payment_initiation_retry_returns_existing_payment(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order(session, order_code="ORD-PAY-2")

    first_response = client.post("/api/v1/payments/ORD-PAY-2/initiate", json={})
    retry_response = client.post("/api/v1/payments/ORD-PAY-2/initiate", json={})

    assert first_response.status_code == 201
    assert retry_response.status_code == 200
    assert retry_response.json()["data"]["id"] == first_response.json()["data"]["id"]

    with session_factory() as session:
        payment_count = len(session.scalars(select(Payment)).all())

    assert payment_count == 1


def test_payment_initiation_rejects_missing_order(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, _ = client_with_session

    response = client.post("/api/v1/payments/ORD-MISSING/initiate", json={})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "ORDER_NOT_FOUND"


def test_payment_initiation_rejects_non_payable_order(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_order(session, order_code="ORD-PAID", status="completed", payment_status="paid")

    response = client.post("/api/v1/payments/ORD-PAID/initiate", json={})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ORDER_NOT_PAYABLE"


def _seed_order(
    session: Session,
    *,
    order_code: str,
    grand_total_amount: Decimal = Decimal("100000.00"),
    status: str = "pending_payment",
    payment_status: str = "pending",
) -> None:
    order = Order(
        order_code=order_code,
        idempotency_key=f"idempotency-{order_code}",
        email="buyer@example.com",
        phone="0900000000",
        status=status,
        payment_status=payment_status,
        fulfillment_status="unfulfilled",
        currency_code="VND",
        subtotal_amount=grand_total_amount,
        discount_amount=Decimal("0.00"),
        shipping_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        grand_total_amount=grand_total_amount,
        placed_at=datetime.now(UTC),
    )
    session.add(order)
    session.commit()
