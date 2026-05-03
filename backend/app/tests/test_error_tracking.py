import logging
from uuid import UUID

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.error_tracking import capture_exception, sanitize_context
from app.middleware.request_context import REQUEST_ID_HEADER, RequestContextMiddleware


def test_sanitize_context_keeps_only_safe_allowlisted_fields() -> None:
    sanitized = sanitize_context(
        {
            "method": "GET",
            "path": "/api/v1/orders",
            "request_id": "request-id",
            "authorization": "Bearer secret",
            "email": "customer@example.com",
            "password": "secret",
            "custom": "not allowlisted",
        }
    )

    assert sanitized == {
        "method": "GET",
        "path": "/api/v1/orders",
        "request_id": "request-id",
    }


def test_capture_exception_logs_safe_event_without_exception_message(caplog) -> None:
    settings = Settings(error_tracking_provider="logging", error_tracking_enabled=True)

    with caplog.at_level(logging.ERROR, logger="app.error_tracking"):
        event_id = capture_exception(
            RuntimeError("secret token should not be logged"),
            context={"component": "backend", "path": "/api/v1/test?token=secret"},
            settings=settings,
        )

    UUID(event_id)
    assert "error_tracking_event" in caplog.text
    assert "RuntimeError" in caplog.text
    assert "secret token should not be logged" not in caplog.text
    assert "token=secret" not in caplog.text


def test_request_context_captures_unhandled_exception_with_safe_envelope() -> None:
    application = FastAPI(debug=False)
    application.add_middleware(RequestContextMiddleware)

    @application.get("/explode")
    def explode() -> None:
        raise RuntimeError("database password leaked")

    client = TestClient(application, raise_server_exceptions=False)
    request_id = "4d5f3c7c-b39f-47d1-a7de-c6e75159165b"

    response = client.get("/explode?password=secret", headers={REQUEST_ID_HEADER: request_id})

    assert response.status_code == 500
    assert response.headers[REQUEST_ID_HEADER] == request_id
    payload = response.json()
    assert payload["data"] is None
    assert payload["meta"]["request_id"] == request_id
    UUID(payload["meta"]["error_event_id"])
    assert payload["error"] == {
        "code": "INTERNAL_SERVER_ERROR",
        "message": "An unexpected error occurred.",
        "details": {},
    }
    assert "password" not in response.text
