from collections.abc import Generator
from datetime import timedelta

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.api.dependencies.auth import get_current_user, require_permission
from app.api.errors import register_exception_handlers
from app.core.config import get_settings
from app.core.db import get_db_session
from app.core.security import create_access_token, hash_password
from app.models.base import Base
from app.models.identity import Role, User, UserRole
from app.services.identity_seed import seed_roles_and_permissions


@pytest.fixture()
def client_with_session(session_factory: sessionmaker[Session]) -> Generator[tuple[TestClient, sessionmaker[Session]], None, None]:
    test_app = FastAPI()
    register_exception_handlers(test_app)

    @test_app.get("/protected")
    def protected_route(current_user: User = Depends(get_current_user)) -> dict:
        return {"data": {"user_id": str(current_user.id)}, "meta": {}, "error": None}

    @test_app.get("/admin")
    def admin_route(current_user: User = Depends(require_permission("manage_users"))) -> dict:
        return {"data": {"user_id": str(current_user.id)}, "meta": {}, "error": None}

    def override_db_session() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    test_app.dependency_overrides[get_db_session] = override_db_session

    with TestClient(test_app) as test_client:
        yield test_client, session_factory


@pytest.fixture()
def session_factory() -> Generator[sessionmaker[Session], None, None]:
    from sqlalchemy import create_engine
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, class_=Session)

    with factory() as session:
        seed_roles_and_permissions(session)

    yield factory

    Base.metadata.drop_all(engine)


def test_current_user_dependency_rejects_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/protected")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_permission_dependency_rejects_user_without_permission(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.get("/admin", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_permission_dependency_allows_user_with_permission(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token = _create_user_token(session_factory, email="admin@example.com", role_code="admin")

    response = client.get("/admin", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["data"]["user_id"]


def _create_user_token(session_factory: sessionmaker[Session], *, email: str, role_code: str) -> str:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="RBAC User",
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
