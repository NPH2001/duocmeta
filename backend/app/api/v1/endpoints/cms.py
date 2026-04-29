from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.cms import PublicPageDetail, PublicPostDetail, PublicRedirectResponse
from app.services.cms import CmsService, CmsServiceError, PaginatedResult


router = APIRouter(tags=["cms"])


@router.get("/pages/{slug}")
def get_page(slug: str, session: Session = Depends(get_db_session)):
    try:
        page = CmsService(session).get_public_page(slug)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(page)


@router.get("/posts")
def list_posts(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_public_posts(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result)


@router.get("/posts/{slug}")
def get_post(slug: str, session: Session = Depends(get_db_session)):
    try:
        post = CmsService(session).get_public_post(slug)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(post)


@router.get("/redirects/resolve")
def resolve_redirect(from_path: str, session: Session = Depends(get_db_session)):
    try:
        redirect = CmsService(session).get_public_redirect(from_path)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(redirect)


def _success_response(data: PublicPageDetail | PublicPostDetail | PublicRedirectResponse) -> dict:
    return {
        "data": data.model_dump(mode="json"),
        "meta": {},
        "error": None,
    }


def _paginated_response(result: PaginatedResult) -> dict:
    return {
        "data": [row.model_dump(mode="json") for row in result.rows],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }


def _error_response(exc: CmsServiceError) -> JSONResponse:
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
