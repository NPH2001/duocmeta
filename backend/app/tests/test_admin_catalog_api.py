from collections.abc import Generator
from datetime import timedelta

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


def test_admin_catalog_rejects_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/admin/brands")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_admin_catalog_rejects_user_without_manage_products(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.get("/api/v1/admin/brands", headers=_auth_headers(token))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_admin_can_crud_brand_and_reject_duplicate_slug(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    create_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Acme", "slug": "Acme"},
        headers=_auth_headers(token),
    )
    duplicate_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Acme Duplicate", "slug": "acme"},
        headers=_auth_headers(token),
    )
    brand_id = create_response.json()["data"]["id"]
    update_response = client.put(
        f"/api/v1/admin/brands/{brand_id}",
        json={"name": "Acme Updated", "is_active": False},
        headers=_auth_headers(token),
    )
    list_response = client.get("/api/v1/admin/brands", headers=_auth_headers(token))
    delete_response = client.delete(f"/api/v1/admin/brands/{brand_id}", headers=_auth_headers(token))

    assert create_response.status_code == 201
    assert create_response.json()["data"]["slug"] == "acme"
    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["error"]["code"] == "BRAND_SLUG_EXISTS"
    assert update_response.status_code == 200
    assert update_response.json()["data"]["name"] == "Acme Updated"
    assert update_response.json()["data"]["is_active"] is False
    assert list_response.status_code == 200
    assert list_response.json()["meta"]["total"] == 1
    assert delete_response.status_code == 204


def test_admin_can_create_category_product_publish_archive_and_variant(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    brand_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Acme", "slug": "acme"},
        headers=_auth_headers(token),
    )
    category_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Supplements", "slug": "supplements"},
        headers=_auth_headers(token),
    )
    product_response = client.post(
        "/api/v1/admin/products",
        json={
            "brand_id": brand_response.json()["data"]["id"],
            "category_ids": [category_response.json()["data"]["id"]],
            "name": "Vitamin C",
            "slug": "vitamin-c",
            "sku": "VC-BASE",
            "min_price": "100000.00",
            "max_price": "120000.00",
        },
        headers=_auth_headers(token),
    )
    product_id = product_response.json()["data"]["id"]
    publish_response = client.post(f"/api/v1/admin/products/{product_id}/publish", headers=_auth_headers(token))
    archive_response = client.post(f"/api/v1/admin/products/{product_id}/archive", headers=_auth_headers(token))
    variant_response = client.post(
        "/api/v1/admin/variants",
        json={"product_id": product_id, "sku": "VC-100", "price": "100000.00"},
        headers=_auth_headers(token),
    )
    variant_id = variant_response.json()["data"]["id"]
    variant_update_response = client.put(
        f"/api/v1/admin/variants/{variant_id}",
        json={"status": "inactive", "price": "95000.00"},
        headers=_auth_headers(token),
    )

    assert brand_response.status_code == 201
    assert category_response.status_code == 201
    assert product_response.status_code == 201
    assert product_response.json()["data"]["status"] == "draft"
    assert publish_response.status_code == 200
    assert publish_response.json()["data"]["status"] == "active"
    assert publish_response.json()["data"]["published_at"] is not None
    assert archive_response.status_code == 200
    assert archive_response.json()["data"]["status"] == "archived"
    assert variant_response.status_code == 201
    assert variant_response.json()["data"]["sku"] == "VC-100"
    assert variant_update_response.status_code == 200
    assert variant_update_response.json()["data"]["status"] == "inactive"


def _create_user_token(session_factory: sessionmaker[Session], *, email: str, role_code: str) -> str:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="Admin Catalog User",
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
