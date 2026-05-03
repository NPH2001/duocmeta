from http import HTTPStatus

from fastapi import APIRouter, Depends, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.rate_limit import rate_limit_checkout_mutation
from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.commerce import CheckoutPreviewRequest, CheckoutPreviewResponse, OrderResponse, PlaceOrderRequest
from app.services.auth import AuthService, AuthServiceError
from app.services.checkout import CheckoutPreviewService
from app.services.commerce import CommerceService, CommerceServiceError


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("/preview")
def preview(
    request: CheckoutPreviewRequest,
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    _: None = Depends(rate_limit_checkout_mutation),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        preview_result = CheckoutPreviewService(session).preview(
            request=request,
            user=user,
            session_id=cart_session_id,
        )
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _preview_response(preview_result)


@router.post("/place-order")
def place_order(
    request: PlaceOrderRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    _: None = Depends(rate_limit_checkout_mutation),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        if idempotency_key is None:
            raise CommerceServiceError(
                "IDEMPOTENCY_KEY_REQUIRED",
                "Idempotency-Key header is required.",
                HTTPStatus.BAD_REQUEST,
            )
        order, created = CommerceService(session).place_order(
            user=user,
            session_id=cart_session_id,
            idempotency_key=idempotency_key,
            email=request.email,
            phone=request.phone,
            notes=request.notes,
        )
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _success_response(order, status_code=HTTPStatus.CREATED if created else HTTPStatus.OK)


def _optional_user(*, authorization: str | None, session: Session, settings: Settings) -> User | None:
    token = _extract_bearer_token(authorization)
    if token is None:
        return None

    return AuthService(session, settings).get_current_user(token)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return None

    return token


def _success_response(data: OrderResponse, *, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"data": data.model_dump(mode="json"), "meta": {}, "error": None},
    )


def _preview_response(data: CheckoutPreviewResponse) -> dict:
    return {"data": data.model_dump(mode="json"), "meta": {}, "error": None}


def _error_response(exc: AuthServiceError | CommerceServiceError) -> JSONResponse:
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
