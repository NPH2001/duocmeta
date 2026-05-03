from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.dependencies.auth import AuthorizationError
from app.core.rate_limit import RateLimitExceeded
from app.services.auth import AuthServiceError


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(AuthServiceError)
    def auth_service_error_handler(_: Request, exc: AuthServiceError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)

    @application.exception_handler(AuthorizationError)
    def authorization_error_handler(_: Request, exc: AuthorizationError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)

    @application.exception_handler(RateLimitExceeded)
    def rate_limit_error_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "data": None,
            "meta": {},
            "error": {
                "code": code,
                "message": message,
                "details": {},
            },
        },
    )
