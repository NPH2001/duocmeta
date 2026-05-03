from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app
from app.middleware.security_headers import SecurityHeadersMiddleware


client = TestClient(app)


def test_health_response_includes_security_headers() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=(), payment=()"
    assert response.headers["Content-Security-Policy"] == (
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    )


def test_trusted_host_rejects_unconfigured_host_with_security_headers() -> None:
    response = client.get("/api/v1/health", headers={"Host": "evil.example"})

    assert response.status_code == 400
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


def test_cors_allows_only_configured_origin() -> None:
    allowed_response = client.options(
        "/api/v1/health",
        headers={
            "Access-Control-Request-Method": "GET",
            "Origin": "http://localhost:8080",
        },
    )
    blocked_response = client.options(
        "/api/v1/health",
        headers={
            "Access-Control-Request-Method": "GET",
            "Origin": "https://evil.example",
        },
    )

    assert allowed_response.status_code == 200
    assert allowed_response.headers["Access-Control-Allow-Origin"] == "http://localhost:8080"
    assert "Access-Control-Allow-Origin" not in blocked_response.headers


def test_hsts_header_is_configurable_for_production() -> None:
    hsts_app = FastAPI()
    hsts_app.add_middleware(
        SecurityHeadersMiddleware,
        settings=Settings(security_hsts_enabled=True, security_hsts_max_age_seconds=123),
    )

    @hsts_app.get("/ping")
    def ping() -> dict[str, str]:
        return {"status": "ok"}

    response = TestClient(hsts_app).get("/ping")

    assert response.headers["Strict-Transport-Security"] == "max-age=123; includeSubDomains"
