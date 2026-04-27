from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.commerce import CustomerOrderListItemResponse
from app.services.commerce import CommerceService, CommerceServiceError, PaginatedResult


router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
def list_orders(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    result = CommerceService(session).list_customer_orders(user=current_user, page=page, page_size=page_size)
    return _paginated_response(result)


@router.get("/{order_code}")
def get_order(
    order_code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).get_customer_order(user=current_user, order_code=order_code)
    except CommerceServiceError as exc:
        return _error_response(exc)

    return _success_response(order.model_dump(mode="json"))


@router.post("/{order_code}/cancel")
def cancel_order(
    order_code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    try:
        order = CommerceService(session).cancel_customer_order(user=current_user, order_code=order_code)
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
