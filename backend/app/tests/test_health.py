from fastapi.testclient import TestClient

from app.main import app


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
