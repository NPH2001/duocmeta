from http import HTTPStatus
from uuid import UUID

from fastapi import APIRouter, Depends, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.rate_limit import rate_limit_cart_mutation
from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.commerce import CartItemCreateRequest, CartItemUpdateRequest, CartResponse
from app.services.auth import AuthService, AuthServiceError
from app.services.commerce import CommerceService, CommerceServiceError


router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("")
def get_cart(
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        cart = CommerceService(session).get_cart(user=user, session_id=cart_session_id)
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _success_response(cart)


@router.post("/items", status_code=HTTPStatus.CREATED)
def add_cart_item(
    request: CartItemCreateRequest,
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    _: None = Depends(rate_limit_cart_mutation),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        cart = CommerceService(session).add_item(
            user=user,
            session_id=cart_session_id,
            variant_id=request.variant_id,
            quantity=request.quantity,
        )
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _success_response(cart)


@router.put("/items/{item_id}")
def update_cart_item(
    item_id: UUID,
    request: CartItemUpdateRequest,
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    _: None = Depends(rate_limit_cart_mutation),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        cart = CommerceService(session).update_item(
            user=user,
            session_id=cart_session_id,
            item_id=item_id,
            quantity=request.quantity,
        )
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _success_response(cart)


@router.delete("/items/{item_id}")
def remove_cart_item(
    item_id: UUID,
    authorization: str | None = Header(default=None),
    cart_session_id: str | None = Header(default=None, alias="X-Cart-Session-ID"),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    _: None = Depends(rate_limit_cart_mutation),
):
    try:
        user = _optional_user(authorization=authorization, session=session, settings=settings)
        cart = CommerceService(session).remove_item(user=user, session_id=cart_session_id, item_id=item_id)
    except (AuthServiceError, CommerceServiceError) as exc:
        return _error_response(exc)

    return _success_response(cart)


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


def _success_response(data: CartResponse) -> dict:
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
