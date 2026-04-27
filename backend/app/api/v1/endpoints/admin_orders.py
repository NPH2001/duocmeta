from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_permission
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.commerce import CustomerOrderListItemResponse
from app.services.commerce import CommerceService, CommerceServiceError, PaginatedResult


router = APIRouter(
    prefix="/admin/orders",
    tags=["admin-orders"],
    dependencies=[Depends(require_permission("manage_orders"))],
)


@router.get("")
def list_orders(
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_db_session),
):
    result = CommerceService(session).list_admin_orders(page=page, page_size=page_size)
    return _paginated_response(result)


@router.get("/{order_code}")
def get_order(order_code: str, session: Session = Depends(get_db_session)):
    try:
        order = CommerceService(session).get_admin_order(order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/confirm")
def confirm_order(
    order_code: str,
    current_user: User = Depends(require_permission("manage_orders")),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).confirm_admin_order(actor=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/ship")
def ship_order(
    order_code: str,
    current_user: User = Depends(require_permission("manage_orders")),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).ship_admin_order(actor=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/deliver")
def deliver_order(
    order_code: str,
    current_user: User = Depends(require_permission("manage_orders")),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).deliver_admin_order(actor=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/cancel")
def cancel_order(
    order_code: str,
    current_user: User = Depends(require_permission("manage_orders")),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).cancel_admin_order(actor=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/refund")
def refund_order(
    order_code: str,
    current_user: User = Depends(require_permission("manage_orders")),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).refund_admin_order(actor=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


def _success_response(data: dict):
    return {"data": data, "meta": {}, "error": None}


def _paginated_response(result: PaginatedResult):
    return {
        "data": [
            CustomerOrderListItemResponse.model_validate(row).model_dump(mode="json") for row in result.rows
        ],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }


def _error_response(exc: CommerceServiceError) -> JSONResponse:
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
