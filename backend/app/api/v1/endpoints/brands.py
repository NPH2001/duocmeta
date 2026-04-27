from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.catalog import PublicBrandResponse
from app.services.catalog import CatalogService, CatalogServiceError, PaginatedResult


router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("")
def list_brands(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CatalogService(session).list_public_brands(page=page, page_size=page_size)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result)


@router.get("/{slug}")
def get_brand(slug: str, session: Session = Depends(get_db_session)):
    try:
        brand = CatalogService(session).get_public_brand(slug)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(PublicBrandResponse.model_validate(brand))


def _success_response(data: PublicBrandResponse) -> dict:
    return {
        "data": data.model_dump(mode="json"),
        "meta": {},
        "error": None,
    }


def _paginated_response(result: PaginatedResult) -> dict:
    return {
        "data": [PublicBrandResponse.model_validate(row).model_dump(mode="json") for row in result.rows],
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
