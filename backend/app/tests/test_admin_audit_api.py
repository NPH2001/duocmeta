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
from app.models.identity import AuditLog, Role, User, UserRole
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


def test_admin_audit_rejects_missing_token(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/admin/audit-logs")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "ACCESS_TOKEN_REQUIRED"


def test_order_manager_can_list_audit_logs(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token, actor_id = _create_user_token(
        session_factory,
        email="orders@example.com",
        role_code="order_manager",
    )

    with session_factory() as session:
        session.add(
            AuditLog(
                actor_user_id=actor_id,
                action_code="order.cancel",
                entity_type="order",
                entity_id=actor_id,
                old_data={"status": "paid"},
                new_data={"status": "cancelled"},
            )
        )
        session.commit()

    response = client.get("/api/v1/admin/audit-logs?entity_type=order", headers=_auth_headers(token))

    assert response.status_code == 200
    assert response.json()["meta"]["total"] == 1
    assert response.json()["data"][0]["action_code"] == "order.cancel"
    assert response.json()["data"][0]["actor_user_id"] == str(actor_id)


def test_customer_cannot_list_audit_logs(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    token, _ = _create_user_token(session_factory, email="customer@example.com", role_code="customer")

    response = client.get("/api/v1/admin/audit-logs", headers=_auth_headers(token))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def _create_user_token(
    session_factory: sessionmaker[Session],
    *,
    email: str,
    role_code: str,
) -> tuple[str, UUID]:
    settings = get_settings()

    with session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password("strong-password"),
            full_name="Audit User",
        )
        session.add(user)
        session.flush()

        role = session.scalar(select(Role).where(Role.code == role_code))
        assert role is not None

        session.add(UserRole(user_id=user.id, role_id=role.id))
        session.commit()
        user_id = user.id

    token = create_access_token(
        subject=str(user_id),
        secret_key=settings.secret_key,
        expires_delta=timedelta(minutes=settings.access_token_ttl_minutes),
    )
    return token, user_id


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
