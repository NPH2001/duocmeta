from http import HTTPStatus
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_permission
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.cms import (
    PageCreateRequest,
    PageResponse,
    PageUpdateRequest,
    PostCreateRequest,
    PostUpdateRequest,
    RedirectCreateRequest,
    RedirectResponse,
    RedirectUpdateRequest,
    SeoMetadataCreateRequest,
    SeoMetadataResponse,
    SeoMetadataUpdateRequest,
    TagCreateRequest,
    TagResponse,
    TagUpdateRequest,
)
from app.services.audit import AuditContext
from app.services.cms import CmsService, CmsServiceError, PaginatedResult, post_response


router = APIRouter(prefix="/admin", tags=["admin-cms"])


@router.get("/pages", dependencies=[Depends(require_permission("manage_pages"))])
def list_pages(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_pages(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result, PageResponse)


@router.post("/pages", status_code=HTTPStatus.CREATED)
def create_page(
    request: PageCreateRequest,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_pages")),
    session: Session = Depends(get_db_session),
):
    try:
        page = CmsService(session).create_page(request, current_user, _audit_context(http_request, current_user))
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(PageResponse.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_id}", dependencies=[Depends(require_permission("manage_pages"))])
def get_page(page_id: UUID, session: Session = Depends(get_db_session)):
    try:
        page = CmsService(session).get_page(page_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(PageResponse.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_id}")
def update_page(
    page_id: UUID,
    request: PageUpdateRequest,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_pages")),
    session: Session = Depends(get_db_session),
):
    try:
        page = CmsService(session).update_page(
            page_id,
            request,
            current_user,
            _audit_context(http_request, current_user),
        )
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(PageResponse.model_validate(page).model_dump(mode="json"))


@router.delete("/pages/{page_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_page(
    page_id: UUID,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_pages")),
    session: Session = Depends(get_db_session),
):
    try:
        CmsService(session).delete_page(page_id, current_user, _audit_context(http_request, current_user))
    except CmsServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/posts", dependencies=[Depends(require_permission("manage_posts"))])
def list_posts(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_posts(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _post_paginated_response(result)


@router.post("/posts", status_code=HTTPStatus.CREATED)
def create_post(
    request: PostCreateRequest,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        post = CmsService(session).create_post(request, current_user, _audit_context(http_request, current_user))
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(post_response(post).model_dump(mode="json"))


@router.get("/posts/{post_id}", dependencies=[Depends(require_permission("manage_posts"))])
def get_post(post_id: UUID, session: Session = Depends(get_db_session)):
    try:
        post = CmsService(session).get_post(post_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(post_response(post).model_dump(mode="json"))


@router.put("/posts/{post_id}")
def update_post(
    post_id: UUID,
    request: PostUpdateRequest,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        post = CmsService(session).update_post(
            post_id,
            request,
            current_user,
            _audit_context(http_request, current_user),
        )
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(post_response(post).model_dump(mode="json"))


@router.delete("/posts/{post_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_post(
    post_id: UUID,
    http_request: Request,
    current_user: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        CmsService(session).delete_post(post_id, current_user, _audit_context(http_request, current_user))
    except CmsServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/tags", dependencies=[Depends(require_permission("manage_posts"))])
def list_tags(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_tags(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result, TagResponse)


@router.post("/tags", status_code=HTTPStatus.CREATED)
def create_tag(
    request: TagCreateRequest,
    _: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        tag = CmsService(session).create_tag(request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(TagResponse.model_validate(tag).model_dump(mode="json"))


@router.get("/tags/{tag_id}", dependencies=[Depends(require_permission("manage_posts"))])
def get_tag(tag_id: UUID, session: Session = Depends(get_db_session)):
    try:
        tag = CmsService(session).get_tag(tag_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(TagResponse.model_validate(tag).model_dump(mode="json"))


@router.put("/tags/{tag_id}")
def update_tag(
    tag_id: UUID,
    request: TagUpdateRequest,
    _: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        tag = CmsService(session).update_tag(tag_id, request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(TagResponse.model_validate(tag).model_dump(mode="json"))


@router.delete("/tags/{tag_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_tag(
    tag_id: UUID,
    _: User = Depends(require_permission("manage_posts")),
    session: Session = Depends(get_db_session),
):
    try:
        CmsService(session).delete_tag(tag_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/seo", dependencies=[Depends(require_permission("manage_seo"))])
def list_seo_metadata(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_seo_metadata(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result, SeoMetadataResponse)


@router.post("/seo", status_code=HTTPStatus.CREATED)
def create_seo_metadata(
    request: SeoMetadataCreateRequest,
    _: User = Depends(require_permission("manage_seo")),
    session: Session = Depends(get_db_session),
):
    try:
        seo_metadata = CmsService(session).create_seo_metadata(request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(SeoMetadataResponse.model_validate(seo_metadata).model_dump(mode="json"))


@router.get("/seo/{seo_metadata_id}", dependencies=[Depends(require_permission("manage_seo"))])
def get_seo_metadata(seo_metadata_id: UUID, session: Session = Depends(get_db_session)):
    try:
        seo_metadata = CmsService(session).get_seo_metadata(seo_metadata_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(SeoMetadataResponse.model_validate(seo_metadata).model_dump(mode="json"))


@router.put("/seo/{seo_metadata_id}")
def update_seo_metadata(
    seo_metadata_id: UUID,
    request: SeoMetadataUpdateRequest,
    _: User = Depends(require_permission("manage_seo")),
    session: Session = Depends(get_db_session),
):
    try:
        seo_metadata = CmsService(session).update_seo_metadata(seo_metadata_id, request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(SeoMetadataResponse.model_validate(seo_metadata).model_dump(mode="json"))


@router.delete("/seo/{seo_metadata_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_seo_metadata(
    seo_metadata_id: UUID,
    _: User = Depends(require_permission("manage_seo")),
    session: Session = Depends(get_db_session),
):
    try:
        CmsService(session).delete_seo_metadata(seo_metadata_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/redirects", dependencies=[Depends(require_permission("manage_redirects"))])
def list_redirects(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    try:
        result = CmsService(session).list_redirects(page=page, page_size=page_size)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _paginated_response(result, RedirectResponse)


@router.post("/redirects", status_code=HTTPStatus.CREATED)
def create_redirect(
    request: RedirectCreateRequest,
    _: User = Depends(require_permission("manage_redirects")),
    session: Session = Depends(get_db_session),
):
    try:
        redirect = CmsService(session).create_redirect(request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(RedirectResponse.model_validate(redirect).model_dump(mode="json"))


@router.get("/redirects/{redirect_id}", dependencies=[Depends(require_permission("manage_redirects"))])
def get_redirect(redirect_id: UUID, session: Session = Depends(get_db_session)):
    try:
        redirect = CmsService(session).get_redirect(redirect_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(RedirectResponse.model_validate(redirect).model_dump(mode="json"))


@router.put("/redirects/{redirect_id}")
def update_redirect(
    redirect_id: UUID,
    request: RedirectUpdateRequest,
    _: User = Depends(require_permission("manage_redirects")),
    session: Session = Depends(get_db_session),
):
    try:
        redirect = CmsService(session).update_redirect(redirect_id, request)
    except CmsServiceError as exc:
        return _error_response(exc)

    return _success_response(RedirectResponse.model_validate(redirect).model_dump(mode="json"))


@router.delete("/redirects/{redirect_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_redirect(
    redirect_id: UUID,
    _: User = Depends(require_permission("manage_redirects")),
    session: Session = Depends(get_db_session),
):
    try:
        CmsService(session).delete_redirect(redirect_id)
    except CmsServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


def _success_response(data: dict):
    return {"data": data, "meta": {}, "error": None}


def _paginated_response(result: PaginatedResult, response_schema):
    return {
        "data": [response_schema.model_validate(row).model_dump(mode="json") for row in result.rows],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }


def _post_paginated_response(result: PaginatedResult):
    return {
        "data": [post_response(row).model_dump(mode="json") for row in result.rows],
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


def _audit_context(request: Request, actor: User) -> AuditContext:
    return AuditContext(
        actor=actor,
        ip_address=request.client.host if request.client is not None else None,
        user_agent=request.headers.get("user-agent"),
    )
