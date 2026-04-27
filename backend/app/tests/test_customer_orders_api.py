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
from app.models.catalog import InventorySnapshot, Product, ProductVariant
from app.models.commerce import Order, OrderItem
from app.models.identity import User


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


def test_customer_can_list_only_own_orders(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    customer_token = _register_customer(client, "customer@example.com")
    other_token = _register_customer(client, "other@example.com")

    with session_factory() as session:
        customer = _user_by_email(session, "customer@example.com")
        other = _user_by_email(session, "other@example.com")
        _seed_order(session, user=customer, order_code="ORD-CUSTOMER-1")
        _seed_order(session, user=other, order_code="ORD-OTHER-1")

    response = client.get("/api/v1/orders", headers=_auth_headers(customer_token))
    other_response = client.get("/api/v1/orders", headers=_auth_headers(other_token))

    assert response.status_code == 200
    assert response.json()["meta"]["total"] == 1
    assert response.json()["data"][0]["order_code"] == "ORD-CUSTOMER-1"
    assert other_response.json()["data"][0]["order_code"] == "ORD-OTHER-1"


def test_customer_can_get_own_order_detail_but_not_other_customer_order(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    customer_token = _register_customer(client, "customer@example.com")
    _register_customer(client, "other@example.com")

    with session_factory() as session:
        customer = _user_by_email(session, "customer@example.com")
        other = _user_by_email(session, "other@example.com")
        _seed_order(session, user=customer, order_code="ORD-CUSTOMER-2", with_item=True)
        _seed_order(session, user=other, order_code="ORD-OTHER-2")

    own_response = client.get("/api/v1/orders/ORD-CUSTOMER-2", headers=_auth_headers(customer_token))
    other_response = client.get("/api/v1/orders/ORD-OTHER-2", headers=_auth_headers(customer_token))

    assert own_response.status_code == 200
    assert own_response.json()["data"]["order_code"] == "ORD-CUSTOMER-2"
    assert own_response.json()["data"]["items"][0]["sku"] == "ORD-CUSTOMER-2-SKU"
    assert other_response.status_code == 404
    assert other_response.json()["error"]["code"] == "ORDER_NOT_FOUND"


def test_customer_can_cancel_pending_order_and_release_inventory(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    customer_token = _register_customer(client, "customer@example.com")

    with session_factory() as session:
        customer = _user_by_email(session, "customer@example.com")
        variant_id = _seed_order(session, user=customer, order_code="ORD-CANCEL-1", with_item=True)

    response = client.post("/api/v1/orders/ORD-CANCEL-1/cancel", headers=_auth_headers(customer_token))

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "cancelled"
    assert response.json()["data"]["cancelled_at"] is not None

    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)

    assert snapshot.reserved_quantity == 0


def test_customer_cannot_cancel_paid_order(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    customer_token = _register_customer(client, "customer@example.com")

    with session_factory() as session:
        customer = _user_by_email(session, "customer@example.com")
        _seed_order(session, user=customer, order_code="ORD-PAID-1", status="paid", payment_status="paid")

    response = client.post("/api/v1/orders/ORD-PAID-1/cancel", headers=_auth_headers(customer_token))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ORDER_NOT_CANCELABLE"


def test_customer_orders_require_authentication(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/orders")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def _register_customer(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strong-password", "full_name": "Customer User"},
    )
    return str(response.json()["data"]["access_token"])


def _auth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def _user_by_email(session: Session, email: str) -> User:
    user = session.scalar(select(User).where(User.email == email))
    assert user is not None
    return user


def _seed_order(
    session: Session,
    *,
    user: User,
    order_code: str,
    status: str = "pending_payment",
    payment_status: str = "pending",
    with_item: bool = False,
):
    order = Order(
        order_code=order_code,
        idempotency_key=f"idempotency-{order_code}",
        user_id=user.id,
        email=user.email,
        phone=user.phone or "0900000000",
        status=status,
        payment_status=payment_status,
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

    if not with_item:
        session.commit()
        return None

    product = Product(
        name=f"{order_code} Product",
        slug=f"{order_code.lower()}-product",
        status="active",
        currency_code="VND",
        published_at=datetime.now(UTC),
    )
    session.add(product)
    session.flush()
    variant = ProductVariant(
        product_id=product.id,
        sku=f"{order_code}-SKU",
        price=Decimal("100000.00"),
        status="active",
    )
    session.add(variant)
    session.flush()
    session.add(InventorySnapshot(variant_id=variant.id, available_quantity=10, reserved_quantity=1))
    session.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            sku=variant.sku,
            unit_price=variant.price,
            quantity=1,
            line_total_amount=variant.price,
        )
    )
    session.commit()
    return variant.id
