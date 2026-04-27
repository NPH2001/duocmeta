from http import HTTPStatus

from fastapi import APIRouter, Cookie, Depends, Header, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth import AuthResult, AuthService, AuthServiceError, _to_user_profile


REFRESH_TOKEN_COOKIE = "refresh_token"

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=HTTPStatus.CREATED)
def register(
    request: RegisterRequest,
    response: Response,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        result = AuthService(session, settings).register(request)
    except AuthServiceError as exc:
        return _error_response(exc)

    _set_refresh_cookie(response, result, settings)
    return _success_response(result.payload.model_dump(mode="json"))


@router.post("/login")
def login(
    request: LoginRequest,
    response: Response,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        result = AuthService(session, settings).login(request)
    except AuthServiceError as exc:
        return _error_response(exc)

    _set_refresh_cookie(response, result, settings)
    return _success_response(result.payload.model_dump(mode="json"))


@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        result = AuthService(session, settings).refresh(refresh_token)
    except AuthServiceError as exc:
        return _error_response(exc)

    _set_refresh_cookie(response, result, settings)
    return _success_response(result.payload.model_dump(mode="json"))


@router.get("/me")
def me(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        user = AuthService(session, settings).get_current_user(_extract_bearer_token(authorization))
    except AuthServiceError as exc:
        return _error_response(exc)

    return _success_response(_to_user_profile(user).model_dump(mode="json"))


def _set_refresh_cookie(response: Response, result: AuthResult, settings: Settings) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=result.refresh_token,
        httponly=True,
        secure=settings.app_env != "development",
        samesite="lax",
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return None

    return token


def _success_response(data: dict) -> dict:
    return {"data": data, "meta": {}, "error": None}


def _error_response(exc: AuthServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "meta": {},
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": {},
            },
        },
    )
