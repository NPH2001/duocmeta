from decimal import Decimal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.catalog import PublicProductDetail, PublicProductListItem
from app.services.catalog import CatalogService, CatalogServiceError, PaginatedResult


router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(
    q: str | None = None,
    category_slug: str | None = None,
    brand_slug: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_db_session),
):
    try:
        result = CatalogService(session).list_public_products(
            q=q,
            category_slug=category_slug,
            brand_slug=brand_slug,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
            page=page,
            page_size=page_size,
        )
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result)


@router.get("/{slug}")
def get_product_detail(slug: str, session: Session = Depends(get_db_session)):
    try:
        product = CatalogService(session).get_public_product_detail(slug)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(product)


def _success_response(data: PublicProductDetail) -> dict:
    return {
        "data": data.model_dump(mode="json"),
        "meta": {},
        "error": None,
    }


def _paginated_response(result: PaginatedResult) -> dict:
    return {
        "data": [PublicProductListItem.model_validate(row).model_dump(mode="json") for row in result.rows],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }


def _error_response(exc: CatalogServiceError) -> JSONResponse:
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
