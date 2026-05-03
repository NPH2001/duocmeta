from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.catalog import InventorySnapshot, Product, ProductVariant


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


def test_guest_cart_can_be_viewed_and_mutated(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session)

    headers = {"X-Cart-Session-ID": "guest-session-1"}
    empty_response = client.get("/api/v1/cart", headers=headers)
    add_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    second_add_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(variant_id), "quantity": 1},
    )
    item_id = second_add_response.json()["data"]["items"][0]["id"]
    update_response = client.put(f"/api/v1/cart/items/{item_id}", headers=headers, json={"quantity": 4})
    delete_response = client.delete(f"/api/v1/cart/items/{item_id}", headers=headers)

    assert empty_response.status_code == 200
    assert empty_response.json()["data"]["items"] == []
    assert add_response.status_code == 201
    assert add_response.json()["data"]["items"][0]["quantity"] == 2
    assert second_add_response.json()["data"]["items"][0]["quantity"] == 3
    assert update_response.json()["data"]["items"][0]["quantity"] == 4
    assert update_response.json()["data"]["items"][0]["product"]["slug"] == "vitamin-c"
    assert update_response.json()["data"]["items"][0]["variant"]["sku"] == "VITAMIN-C-SKU"
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["items"] == []


def test_guest_cart_requires_session_header(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/cart")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "CART_SESSION_REQUIRED"


def test_cart_rejects_non_positive_quantity(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session)

    response = client.post(
        "/api/v1/cart/items",
        headers={"X-Cart-Session-ID": "guest-session-2"},
        json={"variant_id": str(variant_id), "quantity": 0},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_QUANTITY"


def test_cart_revalidates_inventory_on_add_and_update(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session, available_quantity=2)

    headers = {"X-Cart-Session-ID": "guest-session-3"}
    add_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(variant_id), "quantity": 2},
    )
    item_id = add_response.json()["data"]["items"][0]["id"]
    second_add_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(variant_id), "quantity": 1},
    )
    update_response = client.put(f"/api/v1/cart/items/{item_id}", headers=headers, json={"quantity": 3})

    assert add_response.status_code == 201
    assert second_add_response.status_code == 409
    assert second_add_response.json()["error"]["code"] == "INSUFFICIENT_INVENTORY"
    assert update_response.status_code == 409
    assert update_response.json()["error"]["code"] == "INSUFFICIENT_INVENTORY"


def test_cart_rejects_inactive_or_unpublished_variants(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        inactive_variant_id = _seed_variant(session, variant_status="draft", slug="draft-variant-product")
        unpublished_variant_id = _seed_variant(session, published=False, slug="unpublished-product")

    headers = {"X-Cart-Session-ID": "guest-session-4"}
    inactive_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(inactive_variant_id), "quantity": 1},
    )
    unpublished_response = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"variant_id": str(unpublished_variant_id), "quantity": 1},
    )

    assert inactive_response.status_code == 404
    assert inactive_response.json()["error"]["code"] == "VARIANT_NOT_FOUND"
    assert unpublished_response.status_code == 404
    assert unpublished_response.json()["error"]["code"] == "VARIANT_NOT_FOUND"


def _seed_variant(
    session: Session,
    *,
    available_quantity: int = 10,
    variant_status: str = "active",
    published: bool = True,
    slug: str = "vitamin-c",
) -> UUID:
    product = Product(
        name=slug.replace("-", " ").title(),
        slug=slug,
        status="active",
        currency_code="VND",
        published_at=datetime.now(UTC) if published else None,
    )
    session.add(product)
    session.flush()

    variant = ProductVariant(
        product_id=product.id,
        sku=f"{slug.upper()}-SKU",
        price=Decimal("100000.00"),
        status=variant_status,
    )
    session.add(variant)
    session.flush()

    session.add(InventorySnapshot(variant_id=variant.id, available_quantity=available_quantity, reserved_quantity=0))
    session.commit()
    return variant.id


def test_cart_item_mutations_are_scoped_to_cart_session(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session)

    owner_headers = {"X-Cart-Session-ID": "guest-session-owner"}
    other_headers = {"X-Cart-Session-ID": "guest-session-other"}
    add_response = client.post(
        "/api/v1/cart/items",
        headers=owner_headers,
        json={"variant_id": str(variant_id), "quantity": 1},
    )
    client.get("/api/v1/cart", headers=other_headers)
    item_id = add_response.json()["data"]["items"][0]["id"]

    update_response = client.put(f"/api/v1/cart/items/{item_id}", headers=other_headers, json={"quantity": 2})
    delete_response = client.delete(f"/api/v1/cart/items/{item_id}", headers=other_headers)

    assert update_response.status_code == 404
    assert update_response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
    assert delete_response.status_code == 404
    assert delete_response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"


def test_cart_rejects_unknown_item_for_existing_session(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        variant_id = _seed_variant(session)

    headers = {"X-Cart-Session-ID": "guest-session-existing"}
    client.post("/api/v1/cart/items", headers=headers, json={"variant_id": str(variant_id), "quantity": 1})

    unknown_item_id = "4d5f3c7c-b39f-47d1-a7de-c6e75159165b"
    response = client.put(f"/api/v1/cart/items/{unknown_item_id}", headers=headers, json={"quantity": 2})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
