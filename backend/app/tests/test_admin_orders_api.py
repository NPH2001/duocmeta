from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.db import get_db_session
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.base import Base
from app.models.catalog import InventorySnapshot, InventoryTransaction, Product, ProductVariant
from app.models.commerce import Order, OrderItem
from app.models.identity import Role, User, UserRole
from app.services.identity_seed import seed_roles_and_permissions


@pytest.fixture()
def client_with_session() -> Generator[tuple[TestClient, sessionmaker[Session]], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    with session_factory() as seed_session:
        seed_roles_and_permissions(seed_session)

    def override_db_session() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db_session

    with TestClient(app) as test_client:
        yield test_client, session_factory

    app.dependency_overrides.pop(get_db_session, None)
    Base.metadata.drop_all(engine)


def test_admin_orders_reject_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/admin/orders")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_admin_orders_reject_user_without_manage_orders(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.get("/api/v1/admin/orders", headers=_auth_headers(token))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_order_manager_can_list_and_get_order_detail(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="orders@example.com", role_code="order_manager")

    with session_factory() as session:
        user = _create_customer(session, "buyer@example.com")
        _seed_order(session, user=user, order_code="ORD-ADMIN-1", with_item=True)

    list_response = client.get("/api/v1/admin/orders", headers=_auth_headers(token))
    detail_response = client.get("/api/v1/admin/orders/ORD-ADMIN-1", headers=_auth_headers(token))

    assert list_response.status_code == 200
    assert list_response.json()["meta"]["total"] == 1
    assert list_response.json()["data"][0]["order_code"] == "ORD-ADMIN-1"
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["items"][0]["sku"] == "ORD-ADMIN-1-SKU"


def test_admin_order_workflow_confirm_ship_deliver(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    with session_factory() as session:
        user = _create_customer(session, "buyer@example.com")
        _seed_order(session, user=user, order_code="ORD-FLOW-1", status="paid", payment_status="paid")

    confirm_response = client.post("/api/v1/admin/orders/ORD-FLOW-1/confirm", headers=_auth_headers(token))
    ship_response = client.post("/api/v1/admin/orders/ORD-FLOW-1/ship", headers=_auth_headers(token))
    deliver_response = client.post("/api/v1/admin/orders/ORD-FLOW-1/deliver", headers=_auth_headers(token))

    assert confirm_response.status_code == 200
    assert confirm_response.json()["data"]["status"] == "awaiting_fulfillment"
    assert ship_response.status_code == 200
    assert ship_response.json()["data"]["fulfillment_status"] == "shipped"
    assert deliver_response.status_code == 200
    assert deliver_response.json()["data"]["status"] == "completed"
    assert deliver_response.json()["data"]["completed_at"] is not None


def test_admin_order_workflow_rejects_invalid_transition(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    with session_factory() as session:
        user = _create_customer(session, "buyer@example.com")
        _seed_order(session, user=user, order_code="ORD-INVALID-1", status="pending_payment")

    response = client.post("/api/v1/admin/orders/ORD-INVALID-1/ship", headers=_auth_headers(token))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ORDER_SHIP_INVALID_STATE"


def test_admin_cancel_releases_inventory_reservation(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    with session_factory() as session:
        user = _create_customer(session, "buyer@example.com")
        variant_id = _seed_order(session, user=user, order_code="ORD-CANCEL-ADMIN", with_item=True)

    response = client.post("/api/v1/admin/orders/ORD-CANCEL-ADMIN/cancel", headers=_auth_headers(token))

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "cancelled"
    assert response.json()["data"]["cancelled_at"] is not None

    with session_factory() as session:
        snapshot = session.get(InventorySnapshot, variant_id)
        transactions = session.scalars(select(InventoryTransaction)).all()

    assert snapshot is not None
    assert snapshot.reserved_quantity == 0
    assert transactions[-1].transaction_type == "release"


def test_admin_refund_requires_paid_order(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    with session_factory() as session:
        user = _create_customer(session, "buyer@example.com")
        _seed_order(session, user=user, order_code="ORD-REFUND-INVALID", payment_status="pending")

    response = client.post("/api/v1/admin/orders/ORD-REFUND-INVALID/refund", headers=_auth_headers(token))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ORDER_REFUND_INVALID_STATE"


def _create_user_token(session_factory: sessionmaker[Session], *, email: str, role_code: str) -> str:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="Admin Orders User",
        )
        session.add(user)
        session.flush()

        role = session.scalar(select(Role).where(Role.code == role_code))
        assert role is not None

        session.add(UserRole(user_id=user.id, role_id=role.id))
        session.commit()
        user_id = user.id

    return create_access_token(
        subject=str(user_id),
        secret_key=settings.secret_key,
        expires_delta=timedelta(minutes=settings.access_token_ttl_minutes),
    )


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _create_customer(session: Session, email: str) -> User:
    user = User(
        email=email,
        password_hash=hash_password("strong-password"),
        full_name="Customer User",
        phone="0900000000",
    )
    session.add(user)
    session.flush()
    return user


def _seed_order(
    session: Session,
    *,
    user: User,
    order_code: str,
    status: str = "pending_payment",
    payment_status: str = "pending",
    fulfillment_status: str = "unfulfilled",
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
        fulfillment_status=fulfillment_status,
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
