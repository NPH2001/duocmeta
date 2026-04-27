from fastapi.testclient import TestClient
from uuid import UUID

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
