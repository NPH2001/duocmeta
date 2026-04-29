from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.request_context import REQUEST_ID_HEADER


client = TestClient(app)


def test_health_endpoint_returns_success_envelope() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "status": "ok",
            "service": "duocmeta-backend",
            "environment": "development",
        },
        "meta": {},
        "error": None,
    }


def test_health_response_includes_generated_request_id() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert UUID(response.headers[REQUEST_ID_HEADER])


def test_health_response_propagates_valid_request_id() -> None:
    request_id = "4d5f3c7c-b39f-47d1-a7de-c6e75159165b"

    response = client.get("/api/v1/health", headers={REQUEST_ID_HEADER: request_id})

    assert response.status_code == 200
    assert response.headers[REQUEST_ID_HEADER] == request_id


def test_readiness_endpoint_returns_dependency_statuses() -> None:
    with patch("app.api.v1.endpoints.health._database_status", return_value="ok"), patch(
        "app.api.v1.endpoints.health._redis_status",
        return_value="ok",
    ):
        response = client.get("/api/v1/ready")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "status": "ready",
            "service": "duocmeta-backend",
            "environment": "development",
            "checks": {
                "database": {"status": "ok"},
                "redis": {"status": "ok"},
            },
        },
        "meta": {},
        "error": None,
    }


def test_readiness_endpoint_returns_503_when_dependency_is_unavailable() -> None:
    with patch("app.api.v1.endpoints.health._database_status", return_value="ok"), patch(
        "app.api.v1.endpoints.health._redis_status",
        return_value="unavailable",
    ):
        response = client.get("/api/v1/ready")

    assert response.status_code == 503
    assert response.json() == {
        "data": {
            "status": "not_ready",
            "service": "duocmeta-backend",
            "environment": "development",
            "checks": {
                "database": {"status": "ok"},
                "redis": {"status": "unavailable"},
            },
        },
        "meta": {},
        "error": {
            "code": "SERVICE_NOT_READY",
            "message": "Service dependencies are not ready.",
            "details": {},
        },
    }
