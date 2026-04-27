from collections.abc import Generator
from datetime import timedelta
from uuid import uuid4

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
from app.models.content import Page, Post
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


def test_admin_cms_rejects_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/admin/pages")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_admin_cms_rejects_user_without_manage_pages(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.get("/api/v1/admin/pages", headers=_auth_headers(token))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_content_editor_can_crud_pages_and_soft_delete(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="content@example.com", role_code="content_editor")

    create_response = client.post(
        "/api/v1/admin/pages",
        json={"title": "About", "slug": "About", "content": {"blocks": []}, "status": "published"},
        headers=_auth_headers(token),
    )
    duplicate_response = client.post(
        "/api/v1/admin/pages",
        json={"title": "Duplicate", "slug": "about", "content": {"blocks": []}},
        headers=_auth_headers(token),
    )
    page_id = create_response.json()["data"]["id"]
    update_response = client.put(
        f"/api/v1/admin/pages/{page_id}",
        json={"title": "About Updated", "status": "draft"},
        headers=_auth_headers(token),
    )
    list_response = client.get("/api/v1/admin/pages", headers=_auth_headers(token))
    delete_response = client.delete(f"/api/v1/admin/pages/{page_id}", headers=_auth_headers(token))

    assert create_response.status_code == 201
    assert create_response.json()["data"]["slug"] == "about"
    assert create_response.json()["data"]["published_at"] is not None
    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["error"]["code"] == "PAGE_SLUG_EXISTS"
    assert update_response.status_code == 200
    assert update_response.json()["data"]["title"] == "About Updated"
    assert list_response.status_code == 200
    assert list_response.json()["meta"]["total"] == 1
    assert delete_response.status_code == 204

    with session_factory() as session:
        page = session.get(Page, page_id)

    assert page is not None
    assert page.deleted_at is not None


def test_content_editor_can_crud_tags_and_posts(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="posts@example.com", role_code="content_editor")

    tag_response = client.post(
        "/api/v1/admin/tags",
        json={"name": "News", "slug": "News"},
        headers=_auth_headers(token),
    )
    tag_id = tag_response.json()["data"]["id"]
    post_response = client.post(
        "/api/v1/admin/posts",
        json={
            "title": "Launch",
            "slug": "Launch",
            "summary": "A launch post",
            "content": {"blocks": []},
            "tag_ids": [tag_id],
        },
        headers=_auth_headers(token),
    )
    post_id = post_response.json()["data"]["id"]
    update_response = client.put(
        f"/api/v1/admin/posts/{post_id}",
        json={"status": "published", "tag_ids": []},
        headers=_auth_headers(token),
    )
    detail_response = client.get(f"/api/v1/admin/posts/{post_id}", headers=_auth_headers(token))
    delete_response = client.delete(f"/api/v1/admin/posts/{post_id}", headers=_auth_headers(token))

    assert tag_response.status_code == 201
    assert tag_response.json()["data"]["slug"] == "news"
    assert post_response.status_code == 201
    assert post_response.json()["data"]["tag_ids"] == [tag_id]
    assert update_response.status_code == 200
    assert update_response.json()["data"]["status"] == "published"
    assert update_response.json()["data"]["published_at"] is not None
    assert update_response.json()["data"]["tag_ids"] == []
    assert detail_response.status_code == 200
    assert delete_response.status_code == 204

    with session_factory() as session:
        post = session.get(Post, post_id)

    assert post is not None
    assert post.deleted_at is not None


def test_marketing_manager_can_crud_seo_metadata_and_redirects(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="marketing@example.com", role_code="marketing_manager")
    entity_id = str(uuid4())

    seo_response = client.post(
        "/api/v1/admin/seo",
        json={"entity_type": "Page", "entity_id": entity_id, "meta_title": "About SEO"},
        headers=_auth_headers(token),
    )
    duplicate_seo_response = client.post(
        "/api/v1/admin/seo",
        json={"entity_type": "page", "entity_id": entity_id, "meta_title": "Duplicate"},
        headers=_auth_headers(token),
    )
    seo_id = seo_response.json()["data"]["id"]
    seo_update_response = client.put(
        f"/api/v1/admin/seo/{seo_id}",
        json={"robots": "noindex,nofollow"},
        headers=_auth_headers(token),
    )
    redirect_response = client.post(
        "/api/v1/admin/redirects",
        json={"from_path": "/old", "to_path": "/new", "status_code": 301},
        headers=_auth_headers(token),
    )
    redirect_id = redirect_response.json()["data"]["id"]
    redirect_update_response = client.put(
        f"/api/v1/admin/redirects/{redirect_id}",
        json={"status_code": 302, "is_active": False},
        headers=_auth_headers(token),
    )

    assert seo_response.status_code == 201
    assert seo_response.json()["data"]["entity_type"] == "page"
    assert duplicate_seo_response.status_code == 409
    assert duplicate_seo_response.json()["error"]["code"] == "SEO_METADATA_ENTITY_EXISTS"
    assert seo_update_response.status_code == 200
    assert seo_update_response.json()["data"]["robots"] == "noindex,nofollow"
    assert redirect_response.status_code == 201
    assert redirect_update_response.status_code == 200
    assert redirect_update_response.json()["data"]["status_code"] == 302
    assert redirect_update_response.json()["data"]["is_active"] is False


def _create_user_token(session_factory: sessionmaker[Session], *, email: str, role_code: str) -> str:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="Admin CMS User",
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
