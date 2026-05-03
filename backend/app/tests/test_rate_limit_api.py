from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.core.rate_limit import reset_in_memory_rate_limiter
from app.main import app
from app.models.base import Base
from app.services.identity_seed import seed_roles_and_permissions


@pytest.fixture()
def limited_client() -> Generator[TestClient, None, None]:
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

    def override_settings() -> Settings:
        return Settings(
            rate_limit_enabled=True,
            rate_limit_use_redis=False,
            rate_limit_window_seconds=60,
            rate_limit_auth_limit=1,
            rate_limit_cart_limit=1,
            rate_limit_checkout_limit=1,
        )

    reset_in_memory_rate_limiter()
    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_settings] = override_settings

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_db_session, None)
    app.dependency_overrides.pop(get_settings, None)
    reset_in_memory_rate_limiter()
    Base.metadata.drop_all(engine)


def test_auth_rate_limit_returns_standard_429_envelope(limited_client: TestClient) -> None:
    body = {"email": "missing@example.com", "password": "wrong-password"}

    first_response = limited_client.post("/api/v1/auth/login", json=body, headers={"X-Forwarded-For": "203.0.113.10"})
    second_response = limited_client.post("/api/v1/auth/login", json=body, headers={"X-Forwarded-For": "203.0.113.10"})

    assert first_response.status_code == 401
    assert second_response.status_code == 429
    assert second_response.json() == {
        "data": None,
        "meta": {},
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please retry later.",
            "details": {},
        },
    }


def test_cart_mutation_rate_limit_is_scoped_by_client_ip(limited_client: TestClient) -> None:
    unknown_variant_id = str(uuid4())
    body = {"variant_id": unknown_variant_id, "quantity": 1}

    first_response = limited_client.post(
        "/api/v1/cart/items",
        json=body,
        headers={"X-Cart-Session-ID": "cart-a", "X-Forwarded-For": "203.0.113.20"},
    )
    blocked_response = limited_client.post(
        "/api/v1/cart/items",
        json=body,
        headers={"X-Cart-Session-ID": "cart-a", "X-Forwarded-For": "203.0.113.20"},
    )
    other_ip_response = limited_client.post(
        "/api/v1/cart/items",
        json=body,
        headers={"X-Cart-Session-ID": "cart-b", "X-Forwarded-For": "203.0.113.21"},
    )

    assert first_response.status_code != 429
    assert blocked_response.status_code == 429
    assert blocked_response.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert other_ip_response.status_code != 429


def test_checkout_rate_limit_covers_preview_and_place_order(limited_client: TestClient) -> None:
    preview_response = limited_client.post(
        "/api/v1/checkout/preview",
        json={"coupon_code": None, "shipping_method": "standard"},
        headers={"X-Cart-Session-ID": "checkout-a", "X-Forwarded-For": "203.0.113.30"},
    )
    place_order_response = limited_client.post(
        "/api/v1/checkout/place-order",
        json={"email": "guest@example.com", "phone": "0900000000", "notes": None},
        headers={
            "Idempotency-Key": "idem-rate-limit",
            "X-Cart-Session-ID": "checkout-a",
            "X-Forwarded-For": "203.0.113.30",
        },
    )

    assert preview_response.status_code != 429
    assert place_order_response.status_code == 429
    assert place_order_response.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
