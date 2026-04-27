from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.services.identity_seed import seed_roles_and_permissions


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
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
        yield test_client

    app.dependency_overrides.pop(get_db_session, None)
    app.dependency_overrides.pop(get_settings, None)
    Base.metadata.drop_all(engine)


def test_register_returns_access_token_and_refresh_cookie(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "Customer@Example.com",
            "password": "strong-password",
            "full_name": "Customer User",
        },
    )

    payload = response.json()

    assert response.status_code == 201
    assert payload["error"] is None
    assert payload["data"]["token_type"] == "bearer"
    assert payload["data"]["access_token"]
    assert payload["data"]["user"]["email"] == "customer@example.com"
    assert response.cookies.get("refresh_token")


def test_register_rejects_duplicate_email(client: TestClient) -> None:
    body = {
        "email": "customer@example.com",
        "password": "strong-password",
        "full_name": "Customer User",
    }

    first_response = client.post("/api/v1/auth/register", json=body)
    duplicate_response = client.post("/api/v1/auth/register", json=body)

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_login_rejects_invalid_password(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@example.com",
            "password": "strong-password",
            "full_name": "Customer User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "customer@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_returns_current_user_from_bearer_token(client: TestClient) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@example.com",
            "password": "strong-password",
            "full_name": "Customer User",
        },
    )
    access_token = register_response.json()["data"]["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    assert response.json()["data"]["email"] == "customer@example.com"


def test_refresh_rotates_refresh_token_and_rejects_old_token(client: TestClient) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@example.com",
            "password": "strong-password",
            "full_name": "Customer User",
        },
    )
    old_refresh_token = register_response.cookies["refresh_token"]

    client.cookies.set("refresh_token", old_refresh_token)
    refresh_response = client.post("/api/v1/auth/refresh")
    new_refresh_token = refresh_response.cookies["refresh_token"]
    client.cookies.set("refresh_token", old_refresh_token)
    old_token_response = client.post("/api/v1/auth/refresh")

    assert refresh_response.status_code == 200
    assert refresh_response.json()["data"]["access_token"]
    assert new_refresh_token != old_refresh_token
    assert old_token_response.status_code == 401
    assert old_token_response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"
