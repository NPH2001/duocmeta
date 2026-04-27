from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.catalog import InventorySnapshot, InventoryTransaction, Product, ProductVariant
from app.models.commerce import Cart, Coupon, Order


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


def test_guest_place_order_creates_order_snapshot_and_reserves_inventory(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=5)

    cart_headers = {"X-Cart-Session-ID": "checkout-session-1"}
    add_response = client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    order_response = client.post(
        "/api/v1/checkout/place-order",
        headers={**cart_headers, "Idempotency-Key": "place-order-key-1"},
        json={"email": "buyer@example.com", "phone": "0900000000"},
    )

    assert add_response.status_code == 201
    assert order_response.status_code == 201
    data = order_response.json()["data"]
    assert data["order_code"].startswith("ORD-")
    assert data["status"] == "pending_payment"
    assert data["payment_status"] == "pending"
    assert data["fulfillment_status"] == "unfulfilled"
    assert data["subtotal_amount"] == "200000.00"
    assert data["grand_total_amount"] == "200000.00"
    assert data["items"][0]["product_name"] == "Vitamin C"
    assert data["items"][0]["sku"] == "VITAMIN-C-SKU"
    assert data["items"][0]["quantity"] == 2

    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)
        cart = session.scalar(select(Cart).where(Cart.session_id == "checkout-session-1"))
        transaction = session.scalar(select(InventoryTransaction).where(InventoryTransaction.variant_id == variant_id))
        order_count = len(session.scalars(select(Order)).all())

    assert snapshot.reserved_quantity == 2
    assert cart.status == "ordered"
    assert transaction.transaction_type == "reserve"
    assert transaction.reference_type == "order"
    assert order_count == 1


def test_checkout_preview_calculates_backend_totals(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=5)

    cart_headers = {"X-Cart-Session-ID": "preview-session-1"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    response = client.post(
        "/api/v1/checkout/preview",
        headers=cart_headers,
        json={"shipping_method": "express", "payment_method": "cod"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["subtotal_amount"] == "200000.00"
    assert data["discount_amount"] == "0.00"
    assert data["shipping_amount"] == "50000.00"
    assert data["tax_amount"] == "0.00"
    assert data["total_amount"] == "250000.00"
    assert data["items"][0]["quantity"] == 2


def test_checkout_preview_applies_valid_coupon(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=5)
        _seed_coupon(session, code="SALE10", discount_type="percent", discount_value=Decimal("10.00"))

    cart_headers = {"X-Cart-Session-ID": "preview-session-2"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    response = client.post(
        "/api/v1/checkout/preview",
        headers=cart_headers,
        json={"coupon_code": "sale10"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["coupon_code"] == "SALE10"
    assert data["discount_amount"] == "20000.00"
    assert data["total_amount"] == "180000.00"
    assert data["validation_warnings"] == []


def test_checkout_preview_returns_warning_for_invalid_coupon(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=5)
        _seed_coupon(session, code="OLD", is_active=False)

    cart_headers = {"X-Cart-Session-ID": "preview-session-3"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 1},
    )
    response = client.post(
        "/api/v1/checkout/preview",
        headers=cart_headers,
        json={"coupon_code": "OLD"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["coupon_code"] == "OLD"
    assert data["discount_amount"] == "0.00"
    assert data["total_amount"] == "100000.00"
    assert data["validation_warnings"] == ["Coupon is inactive."]


def test_checkout_preview_revalidates_inventory(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=2)

    cart_headers = {"X-Cart-Session-ID": "preview-session-4"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)
        snapshot.reserved_quantity = 1
        session.commit()

    response = client.post("/api/v1/checkout/preview", headers=cart_headers, json={})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INSUFFICIENT_INVENTORY"


def test_place_order_requires_idempotency_key(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session)

    cart_headers = {"X-Cart-Session-ID": "checkout-session-2"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 1},
    )
    response = client.post(
        "/api/v1/checkout/place-order",
        headers=cart_headers,
        json={"email": "buyer@example.com", "phone": "0900000000"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "IDEMPOTENCY_KEY_REQUIRED"


def test_place_order_retries_return_existing_order_without_double_reserving(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=5)

    headers = {"X-Cart-Session-ID": "checkout-session-3", "Idempotency-Key": "place-order-key-3"}
    client.post(
        "/api/v1/cart/items",
        headers={"X-Cart-Session-ID": "checkout-session-3"},
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    first_response = client.post(
        "/api/v1/checkout/place-order",
        headers=headers,
        json={"email": "buyer@example.com", "phone": "0900000000"},
    )
    retry_response = client.post(
        "/api/v1/checkout/place-order",
        headers=headers,
        json={"email": "buyer@example.com", "phone": "0900000000"},
    )

    assert first_response.status_code == 201
    assert retry_response.status_code == 200
    assert retry_response.json()["data"]["id"] == first_response.json()["data"]["id"]

    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)
        order_count = len(session.scalars(select(Order)).all())
        transaction_count = len(session.scalars(select(InventoryTransaction)).all())

    assert snapshot.reserved_quantity == 2
    assert order_count == 1
    assert transaction_count == 1


def test_place_order_revalidates_inventory(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=2)

    cart_headers = {"X-Cart-Session-ID": "checkout-session-4"}
    client.post(
        "/api/v1/cart/items",
        headers=cart_headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)
        snapshot.reserved_quantity = 1
        session.commit()

    response = client.post(
        "/api/v1/checkout/place-order",
        headers={**cart_headers, "Idempotency-Key": "place-order-key-4"},
        json={"email": "buyer@example.com", "phone": "0900000000"},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INSUFFICIENT_INVENTORY"


def _seed_variant(
    session: Session,
    *,
    available_quantity: int = 10,
    slug: str = "vitamin-c",
) -> UUID:
    product = Product(
        name=slug.replace("-", " ").title(),
        slug=slug,
        status="active",
        currency_code="VND",
        published_at=datetime.now(UTC),
    )
    session.add(product)
    session.flush()

    variant = ProductVariant(
        product_id=product.id,
        sku=f"{slug.upper()}-SKU",
        price=Decimal("100000.00"),
        status="active",
    )
    session.add(variant)
    session.flush()

    session.add(InventorySnapshot(variant_id=variant.id, available_quantity=available_quantity, reserved_quantity=0))
    session.commit()
    return variant.id


def _seed_coupon(
    session: Session,
    *,
    code: str,
    discount_type: str = "fixed_amount",
    discount_value: Decimal = Decimal("10000.00"),
    is_active: bool = True,
) -> None:
    session.add(
        Coupon(
            code=code,
            name=code,
            discount_type=discount_type,
            discount_value=discount_value,
            is_active=is_active,
        )
    )
    session.commit()
