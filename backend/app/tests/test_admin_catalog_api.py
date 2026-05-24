from collections.abc import Generator
from datetime import timedelta
from uuid import UUID

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
from app.models.catalog import MediaFile, Product, ProductImage
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


def test_admin_can_create_and_delete_category(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin-category@example.com", role_code="admin")

    create_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc điều trị ung thư", "slug": "thuoc-dieu-tri-ung-thu"},
        headers=_auth_headers(token),
    )
    category_id = create_response.json()["data"]["id"]
    list_response = client.get("/api/v1/admin/categories?page=1&page_size=20", headers=_auth_headers(token))
    delete_response = client.delete(f"/api/v1/admin/categories/{category_id}", headers=_auth_headers(token))
    list_after_delete_response = client.get("/api/v1/admin/categories?page=1&page_size=20", headers=_auth_headers(token))

    assert create_response.status_code == 201
    assert create_response.json()["data"]["slug"] == "thuoc-dieu-tri-ung-thu"
    assert list_response.status_code == 200
    assert list_response.json()["meta"]["total"] == 1
    assert delete_response.status_code == 204
    assert list_after_delete_response.status_code == 200
    assert list_after_delete_response.json()["meta"]["total"] == 0


def test_admin_cannot_delete_category_with_children_or_products(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin-category-guard@example.com", role_code="admin")

    parent_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc điều trị Lupus", "slug": "thuoc-dieu-tri-lupus"},
        headers=_auth_headers(token),
    )
    parent_id = parent_response.json()["data"]["id"]

    child_response = client.post(
        "/api/v1/admin/categories",
        json={
            "name": "Thuốc điều trị Lupus sinh học",
            "slug": "thuoc-dieu-tri-lupus-sinh-hoc",
            "parent_id": parent_id,
        },
        headers=_auth_headers(token),
    )
    delete_parent_response = client.delete(f"/api/v1/admin/categories/{parent_id}", headers=_auth_headers(token))

    brand_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Acme", "slug": "acme-delete-guard"},
        headers=_auth_headers(token),
    )
    linked_category_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc điều trị ung thư", "slug": "thuoc-dieu-tri-ung-thu"},
        headers=_auth_headers(token),
    )
    linked_category_id = linked_category_response.json()["data"]["id"]
    product_response = client.post(
        "/api/v1/admin/products",
        json={
            "brand_id": brand_response.json()["data"]["id"],
            "category_ids": [linked_category_id],
            "name": "Keytruda",
            "slug": "keytruda-delete-guard",
            "sku": "RX-ONC-DELETE-GUARD",
            "product_type": "prescription_reference",
        },
        headers=_auth_headers(token),
    )
    delete_linked_response = client.delete(
        f"/api/v1/admin/categories/{linked_category_id}",
        headers=_auth_headers(token),
    )

    assert child_response.status_code == 201
    assert delete_parent_response.status_code == 409
    assert delete_parent_response.json()["error"]["code"] == "CATEGORY_HAS_CHILDREN"
    assert product_response.status_code == 201
    assert delete_linked_response.status_code == 409
    assert delete_linked_response.json()["error"]["code"] == "CATEGORY_HAS_PRODUCTS"


def test_admin_can_soft_delete_product_and_hide_it_from_admin_list(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin-delete-product@example.com", role_code="admin")

    brand_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Delete Brand", "slug": "delete-brand"},
        headers=_auth_headers(token),
    )
    category_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc HIV", "slug": "thuoc-hiv-delete"},
        headers=_auth_headers(token),
    )
    product_response = client.post(
        "/api/v1/admin/products",
        json={
            "brand_id": brand_response.json()["data"]["id"],
            "category_ids": [category_response.json()["data"]["id"]],
            "name": "Delete Me",
            "slug": "delete-me",
            "sku": "DELETE-ME-001",
            "product_type": "prescription_reference",
        },
        headers=_auth_headers(token),
    )
    product_id = product_response.json()["data"]["id"]
    product_uuid = UUID(product_id)

    delete_response = client.delete(f"/api/v1/admin/products/{product_id}", headers=_auth_headers(token))
    detail_response = client.get(f"/api/v1/admin/products/{product_id}", headers=_auth_headers(token))
    list_response = client.get("/api/v1/admin/products?page=1&page_size=20", headers=_auth_headers(token))

    assert product_response.status_code == 201
    assert delete_response.status_code == 204
    assert detail_response.status_code == 404
    assert detail_response.json()["error"]["code"] == "PRODUCT_NOT_FOUND"
    assert list_response.status_code == 200
    assert list_response.json()["meta"]["total"] == 0

    with session_factory() as session:
        deleted_product = session.get(Product, product_uuid)
        assert deleted_product is not None
        assert deleted_product.deleted_at is not None
        assert deleted_product.status == "archived"


def test_admin_can_delete_category_after_only_linked_product_is_soft_deleted(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin-delete-category-after-product@example.com", role_code="admin")

    brand_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Delete Category Brand", "slug": "delete-category-brand"},
        headers=_auth_headers(token),
    )
    category_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc HIV", "slug": "thuoc-hiv-soft-delete-guard"},
        headers=_auth_headers(token),
    )
    category_id = category_response.json()["data"]["id"]
    product_response = client.post(
        "/api/v1/admin/products",
        json={
            "brand_id": brand_response.json()["data"]["id"],
            "category_ids": [category_id],
            "name": "Delete Category Product",
            "slug": "delete-category-product",
            "sku": "DELETE-CATEGORY-001",
            "product_type": "prescription_reference",
        },
        headers=_auth_headers(token),
    )
    product_id = product_response.json()["data"]["id"]

    delete_product_response = client.delete(f"/api/v1/admin/products/{product_id}", headers=_auth_headers(token))
    delete_category_response = client.delete(f"/api/v1/admin/categories/{category_id}", headers=_auth_headers(token))
    list_categories_response = client.get("/api/v1/admin/categories?page=1&page_size=20", headers=_auth_headers(token))

    assert brand_response.status_code == 201
    assert category_response.status_code == 201
    assert product_response.status_code == 201
    assert delete_product_response.status_code == 204
    assert delete_category_response.status_code == 204
    assert list_categories_response.status_code == 200
    assert list_categories_response.json()["meta"]["total"] == 0


def test_admin_can_create_category_product_publish_archive_and_variant(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    with session_factory() as session:
        media = MediaFile(
            storage_key="products/2026/05/09/hydroxychloroquine.jpg",
            filename="hydroxychloroquine.jpg",
            mime_type="image/jpeg",
            size_bytes=2048,
            width=1200,
            height=900,
            alt_text="Hydroxychloroquine packshot",
        )
        session.add(media)
        session.commit()
        primary_media_id = str(media.id)

    brand_response = client.post(
        "/api/v1/admin/brands",
        json={"name": "Acme", "slug": "acme"},
        headers=_auth_headers(token),
    )
    category_response = client.post(
        "/api/v1/admin/categories",
        json={"name": "Thuốc điều trị Lupus", "slug": "thuoc-dieu-tri-lupus"},
        headers=_auth_headers(token),
    )
    product_response = client.post(
        "/api/v1/admin/products",
        json={
            "brand_id": brand_response.json()["data"]["id"],
            "category_ids": [category_response.json()["data"]["id"]],
            "primary_image_media_id": primary_media_id,
            "name": "Hydroxychloroquine",
            "slug": "hydroxychloroquine",
            "sku": "RX-LUPUS-HCQ",
            "product_type": "prescription_reference",
        },
        headers=_auth_headers(token),
    )
    product_id = product_response.json()["data"]["id"]
    product_detail_response = client.get(f"/api/v1/admin/products/{product_id}", headers=_auth_headers(token))
    categories_response = client.get("/api/v1/admin/categories?page=1&page_size=20", headers=_auth_headers(token))
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
    assert category_response.json()["data"]["classification"]["group_label"] == "Thuốc điều trị Lupus"
    assert product_response.status_code == 201
    assert product_response.json()["data"]["status"] == "draft"
    assert product_response.json()["data"]["images"] == [
        {
            "id": product_response.json()["data"]["images"][0]["id"],
            "product_id": product_id,
            "variant_id": None,
            "media_id": primary_media_id,
            "sort_order": 1,
            "is_primary": True,
            "media": {
                "id": primary_media_id,
                "storage_key": "products/2026/05/09/hydroxychloroquine.jpg",
                "filename": "hydroxychloroquine.jpg",
                "mime_type": "image/jpeg",
                "size_bytes": 2048,
                "width": 1200,
                "height": 900,
                "alt_text": "Hydroxychloroquine packshot",
                "uploaded_by": None,
                "created_at": product_response.json()["data"]["images"][0]["media"]["created_at"],
                "derivatives": [],
            },
        }
    ]
    assert product_detail_response.status_code == 200
    assert product_detail_response.json()["data"]["categories"] == [
        {
            "category_id": category_response.json()["data"]["id"],
            "is_primary": True,
            "category": {
                "id": category_response.json()["data"]["id"],
                "parent_id": None,
                "name": "Thuốc điều trị Lupus",
                "slug": "thuoc-dieu-tri-lupus",
                "is_active": True,
                "classification": {
                    "group_code": "lupus-treatment",
                    "group_label": "Thuốc điều trị Lupus",
                    "allowed_product_types": ["prescription_reference", "prescription_medicine"],
                    "medicine_suggestions": [
                        "Hydroxychloroquine",
                        "Belimumab",
                        "Mycophenolate mofetil",
                        "Prednisone",
                        "Thuốc điều trị Lupus theo toa",
                    ],
                    "guidance": "Chỉ nên thêm thuốc điều trị Lupus hoặc mục tham chiếu kê đơn cần bác sĩ/dược sĩ chuyên môn xác nhận.",
                },
            },
        }
    ]
    assert product_detail_response.json()["data"]["images"][0]["media"]["storage_key"] == "products/2026/05/09/hydroxychloroquine.jpg"
    assert categories_response.status_code == 200
    assert categories_response.json()["data"][0]["classification"]["allowed_product_types"] == ["prescription_reference", "prescription_medicine"]
    assert publish_response.status_code == 200
    assert publish_response.json()["data"]["status"] == "active"
    assert publish_response.json()["data"]["published_at"] is not None
    assert archive_response.status_code == 200
    assert archive_response.json()["data"]["status"] == "archived"
    assert variant_response.status_code == 201
    assert variant_response.json()["data"]["sku"] == "VC-100"
    assert variant_update_response.status_code == 200
    assert variant_update_response.json()["data"]["status"] == "inactive"

    with session_factory() as session:
        assert session.query(ProductImage).count() == 1


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
