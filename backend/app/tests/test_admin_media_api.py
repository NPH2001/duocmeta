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
from app.models.catalog import MediaFile
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


def test_admin_media_rejects_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.post(
        "/api/v1/admin/media/presign",
        json={"filename": "image.png", "mime_type": "image/png", "size_bytes": 100},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_catalog_manager_can_presign_and_complete_upload(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="media@example.com", role_code="catalog_manager")

    presign_response = client.post(
        "/api/v1/admin/media/presign",
        json={"filename": "Image.png", "mime_type": "image/png", "size_bytes": 1024},
        headers=_auth_headers(token),
    )
    storage_key = presign_response.json()["data"]["storage_key"]
    complete_response = client.post(
        "/api/v1/admin/media/complete",
        json={
            "storage_key": storage_key,
            "filename": "Image.png",
            "mime_type": "image/png",
            "size_bytes": 1024,
            "width": 800,
            "height": 600,
            "alt_text": "Uploaded product image",
        },
        headers=_auth_headers(token),
    )

    assert presign_response.status_code == 201
    assert presign_response.json()["data"]["method"] == "PUT"
    assert complete_response.status_code == 201
    assert complete_response.json()["data"]["storage_key"] == storage_key
    assert complete_response.json()["data"]["alt_text"] == "Uploaded product image"
    assert [derivative["kind"] for derivative in complete_response.json()["data"]["derivatives"]] == ["w320"]

    with session_factory() as session:
        media_file = session.scalar(select(MediaFile).where(MediaFile.storage_key == storage_key))

    assert media_file is not None
    assert media_file.uploaded_by is not None


def test_admin_media_rejects_user_without_manage_media(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.post(
        "/api/v1/admin/media/presign",
        json={"filename": "image.png", "mime_type": "image/png", "size_bytes": 100},
        headers=_auth_headers(token),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def _create_user_token(session_factory: sessionmaker[Session], *, email: str, role_code: str) -> str:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="Admin Media User",
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
