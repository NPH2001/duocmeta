from dataclasses import dataclass
from datetime import UTC, datetime
from http import HTTPStatus
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.content import Page, Post, Redirect, SeoMetadata, Tag
from app.models.identity import User
from app.repositories.cms import CmsRepository
from app.schemas.cms import (
    PageCreateRequest,
    PageUpdateRequest,
    PostCreateRequest,
    PublicPageDetail,
    PublicPostDetail,
    PublicPostListItem,
    PublicRedirectResponse,
    PublicSeoMetadata,
    PostResponse,
    PostUpdateRequest,
    RedirectCreateRequest,
    RedirectUpdateRequest,
    SeoMetadataCreateRequest,
    SeoMetadataUpdateRequest,
    TagCreateRequest,
    TagUpdateRequest,
)
from app.services.audit import AuditContext, AuditService


class CmsServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class PaginatedResult:
    rows: list
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        if self.total == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


class CmsService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CmsRepository(session)
        self.audit = AuditService(session)

    def list_pages(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_pages(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_page(
        self,
        request: PageCreateRequest,
        actor: User,
        audit_context: AuditContext | None = None,
    ) -> Page:
        _validate_content_status(request.status)
        self._ensure_page_slug_available(request.slug)
        page = self.repository.add_page(
            Page(
                title=request.title,
                slug=request.slug,
                content=request.content,
                status=request.status,
                published_at=_published_at_for_status(request.status, request.published_at),
                created_by=actor.id,
                updated_by=actor.id,
            )
        )
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="page.create",
            entity_type="page",
            entity_id=page.id,
            new_data=_page_audit_data(page),
        )
        self.session.commit()
        return page

    def get_page(self, page_id: UUID) -> Page:
        page = self.repository.get_page(page_id)
        if page is None:
            raise _not_found("PAGE_NOT_FOUND", "Page was not found.")
        return page

    def update_page(
        self,
        page_id: UUID,
        request: PageUpdateRequest,
        actor: User,
        audit_context: AuditContext | None = None,
    ) -> Page:
        page = self.get_page(page_id)
        old_data = _page_audit_data(page)
        update_data = request.model_dump(exclude_unset=True)

        if "status" in update_data:
            _validate_content_status(update_data["status"])
            update_data["published_at"] = _published_at_for_status(
                update_data["status"],
                update_data.get("published_at"),
            )

        if "slug" in update_data and update_data["slug"] != page.slug:
            self._ensure_page_slug_available(update_data["slug"], exclude_id=page.id)

        for field, value in update_data.items():
            setattr(page, field, value)

        page.updated_by = actor.id
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="page.update",
            entity_type="page",
            entity_id=page.id,
            old_data=old_data,
            new_data=_page_audit_data(page),
        )
        self.session.commit()
        return page

    def delete_page(self, page_id: UUID, actor: User, audit_context: AuditContext | None = None) -> None:
        page = self.get_page(page_id)
        old_data = _page_audit_data(page)
        page.deleted_at = datetime.now(UTC)
        page.updated_by = actor.id
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="page.delete",
            entity_type="page",
            entity_id=page.id,
            old_data=old_data,
            new_data=_page_audit_data(page),
        )
        self.session.commit()

    def list_posts(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_posts(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_post(
        self,
        request: PostCreateRequest,
        actor: User,
        audit_context: AuditContext | None = None,
    ) -> Post:
        _validate_content_status(request.status)
        self._ensure_post_slug_available(request.slug)
        self._ensure_tags_exist(request.tag_ids)
        post = self.repository.add_post(
            Post(
                title=request.title,
                slug=request.slug,
                summary=request.summary,
                content=request.content,
                status=request.status,
                published_at=_published_at_for_status(request.status, request.published_at),
                author_id=actor.id,
            )
        )
        self.repository.set_post_tags(post, request.tag_ids)
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="post.create",
            entity_type="post",
            entity_id=post.id,
            new_data=_post_audit_data(post),
        )
        post_id = post.id
        self.session.commit()
        return self.get_post(post_id)

    def get_post(self, post_id: UUID) -> Post:
        post = self.repository.get_post(post_id)
        if post is None:
            raise _not_found("POST_NOT_FOUND", "Post was not found.")
        return post

    def update_post(
        self,
        post_id: UUID,
        request: PostUpdateRequest,
        actor: User,
        audit_context: AuditContext | None = None,
    ) -> Post:
        post = self.get_post(post_id)
        old_data = _post_audit_data(post)
        update_data = request.model_dump(exclude_unset=True)
        tag_ids = update_data.pop("tag_ids", None)

        if "status" in update_data:
            _validate_content_status(update_data["status"])
            update_data["published_at"] = _published_at_for_status(
                update_data["status"],
                update_data.get("published_at"),
            )

        if "slug" in update_data and update_data["slug"] != post.slug:
            self._ensure_post_slug_available(update_data["slug"], exclude_id=post.id)

        for field, value in update_data.items():
            setattr(post, field, value)

        if tag_ids is not None:
            self._ensure_tags_exist(tag_ids)
            self.repository.set_post_tags(post, tag_ids)

        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="post.update",
            entity_type="post",
            entity_id=post.id,
            old_data=old_data,
            new_data=_post_audit_data(post),
        )
        post_id = post.id
        self.session.commit()
        return self.get_post(post_id)

    def delete_post(
        self,
        post_id: UUID,
        actor: User,
        audit_context: AuditContext | None = None,
    ) -> None:
        post = self.get_post(post_id)
        old_data = _post_audit_data(post)
        post.deleted_at = datetime.now(UTC)
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code="post.delete",
            entity_type="post",
            entity_id=post.id,
            old_data=old_data,
            new_data=_post_audit_data(post),
        )
        self.session.commit()

    def list_tags(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_tags(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_tag(self, request: TagCreateRequest) -> Tag:
        self._ensure_tag_slug_available(request.slug)
        tag = self.repository.add_tag(Tag(**request.model_dump()))
        self.session.commit()
        return tag

    def get_tag(self, tag_id: UUID) -> Tag:
        tag = self.repository.get_tag(tag_id)
        if tag is None:
            raise _not_found("TAG_NOT_FOUND", "Tag was not found.")
        return tag

    def update_tag(self, tag_id: UUID, request: TagUpdateRequest) -> Tag:
        tag = self.get_tag(tag_id)
        update_data = request.model_dump(exclude_unset=True)

        if "slug" in update_data and update_data["slug"] != tag.slug:
            self._ensure_tag_slug_available(update_data["slug"], exclude_id=tag.id)

        for field, value in update_data.items():
            setattr(tag, field, value)

        self.session.commit()
        return tag

    def delete_tag(self, tag_id: UUID) -> None:
        tag = self.get_tag(tag_id)
        self.repository.delete_tag(tag)
        self.session.commit()

    def list_seo_metadata(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_seo_metadata(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_seo_metadata(self, request: SeoMetadataCreateRequest) -> SeoMetadata:
        self._ensure_seo_entity_available(entity_type=request.entity_type, entity_id=request.entity_id)
        seo_metadata = self.repository.add_seo_metadata(SeoMetadata(**request.model_dump()))
        self.session.commit()
        return seo_metadata

    def get_seo_metadata(self, seo_metadata_id: UUID) -> SeoMetadata:
        seo_metadata = self.repository.get_seo_metadata(seo_metadata_id)
        if seo_metadata is None:
            raise _not_found("SEO_METADATA_NOT_FOUND", "SEO metadata was not found.")
        return seo_metadata

    def update_seo_metadata(self, seo_metadata_id: UUID, request: SeoMetadataUpdateRequest) -> SeoMetadata:
        seo_metadata = self.get_seo_metadata(seo_metadata_id)
        update_data = request.model_dump(exclude_unset=True)
        next_entity_type = update_data.get("entity_type", seo_metadata.entity_type)
        next_entity_id = update_data.get("entity_id", seo_metadata.entity_id)

        if next_entity_type != seo_metadata.entity_type or next_entity_id != seo_metadata.entity_id:
            self._ensure_seo_entity_available(
                entity_type=next_entity_type,
                entity_id=next_entity_id,
                exclude_id=seo_metadata.id,
            )

        for field, value in update_data.items():
            setattr(seo_metadata, field, value)

        self.session.commit()
        return seo_metadata

    def delete_seo_metadata(self, seo_metadata_id: UUID) -> None:
        seo_metadata = self.get_seo_metadata(seo_metadata_id)
        self.repository.delete_seo_metadata(seo_metadata)
        self.session.commit()

    def list_redirects(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_redirects(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_redirect(self, request: RedirectCreateRequest) -> Redirect:
        _validate_redirect_status_code(request.status_code)
        self._ensure_redirect_from_path_available(request.from_path)
        redirect = self.repository.add_redirect(Redirect(**request.model_dump()))
        self.session.commit()
        return redirect

    def get_redirect(self, redirect_id: UUID) -> Redirect:
        redirect = self.repository.get_redirect(redirect_id)
        if redirect is None:
            raise _not_found("REDIRECT_NOT_FOUND", "Redirect was not found.")
        return redirect

    def update_redirect(self, redirect_id: UUID, request: RedirectUpdateRequest) -> Redirect:
        redirect = self.get_redirect(redirect_id)
        update_data = request.model_dump(exclude_unset=True)

        if "status_code" in update_data:
            _validate_redirect_status_code(update_data["status_code"])

        if "from_path" in update_data and update_data["from_path"] != redirect.from_path:
            self._ensure_redirect_from_path_available(update_data["from_path"], exclude_id=redirect.id)

        for field, value in update_data.items():
            setattr(redirect, field, value)

        self.session.commit()
        return redirect

    def delete_redirect(self, redirect_id: UUID) -> None:
        redirect = self.get_redirect(redirect_id)
        self.repository.delete_redirect(redirect)
        self.session.commit()

    def get_public_page(self, slug: str) -> PublicPageDetail:
        page = self.repository.get_public_page_by_slug(slug=slug, now=datetime.now(UTC))
        if page is None:
            raise _not_found("PAGE_NOT_FOUND", "Page was not found.")

        assert page.published_at is not None
        return PublicPageDetail(
            id=page.id,
            title=page.title,
            slug=page.slug,
            content=page.content,
            published_at=page.published_at,
            seo=_public_seo(self.repository.get_seo_metadata_by_entity(entity_type="page", entity_id=page.id)),
        )

    def list_public_posts(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_public_posts(
            offset=_offset(page, page_size),
            limit=page_size,
            now=datetime.now(UTC),
        )
        return PaginatedResult(
            rows=[self._public_post_list_item(post) for post in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_public_post(self, slug: str) -> PublicPostDetail:
        post = self.repository.get_public_post_by_slug(slug=slug, now=datetime.now(UTC))
        if post is None:
            raise _not_found("POST_NOT_FOUND", "Post was not found.")

        assert post.published_at is not None
        return PublicPostDetail(
            id=post.id,
            title=post.title,
            slug=post.slug,
            summary=post.summary,
            content=post.content,
            published_at=post.published_at,
            tag_ids=[post_tag.tag_id for post_tag in post.tags],
            seo=_public_seo(self.repository.get_seo_metadata_by_entity(entity_type="post", entity_id=post.id)),
        )

    def get_public_redirect(self, from_path: str) -> PublicRedirectResponse:
        redirect = self.repository.get_active_redirect_by_from_path(_normalize_redirect_lookup_path(from_path))
        if redirect is None:
            raise _not_found("REDIRECT_NOT_FOUND", "Redirect was not found.")

        return PublicRedirectResponse(
            from_path=redirect.from_path,
            to_path=redirect.to_path,
            status_code=redirect.status_code,
        )

    def _ensure_page_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_page_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("PAGE_SLUG_EXISTS", "Page slug already exists.")

    def _ensure_post_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_post_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("POST_SLUG_EXISTS", "Post slug already exists.")

    def _ensure_tag_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_tag_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("TAG_SLUG_EXISTS", "Tag slug already exists.")

    def _ensure_tags_exist(self, tag_ids: list[UUID]) -> None:
        for tag_id in tag_ids:
            if self.repository.get_tag(tag_id) is None:
                raise _not_found("TAG_NOT_FOUND", "Tag was not found.")

    def _ensure_seo_entity_available(
        self,
        *,
        entity_type: str,
        entity_id: UUID,
        exclude_id: UUID | None = None,
    ) -> None:
        existing = self.repository.get_seo_metadata_by_entity(entity_type=entity_type, entity_id=entity_id)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("SEO_METADATA_ENTITY_EXISTS", "SEO metadata already exists for this entity.")

    def _ensure_redirect_from_path_available(self, from_path: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_redirect_by_from_path(from_path)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("REDIRECT_FROM_PATH_EXISTS", "Redirect source path already exists.")

    def _public_post_list_item(self, post: Post) -> PublicPostListItem:
        assert post.published_at is not None
        return PublicPostListItem(
            id=post.id,
            title=post.title,
            slug=post.slug,
            summary=post.summary,
            published_at=post.published_at,
            tag_ids=[post_tag.tag_id for post_tag in post.tags],
            seo=_public_seo(self.repository.get_seo_metadata_by_entity(entity_type="post", entity_id=post.id)),
        )


def post_response(post: Post) -> PostResponse:
    return PostResponse.model_validate(post).model_copy(
        update={"tag_ids": [post_tag.tag_id for post_tag in post.tags]}
    )


def _public_seo(seo_metadata: SeoMetadata | None) -> PublicSeoMetadata | None:
    if seo_metadata is None:
        return None

    return PublicSeoMetadata(
        meta_title=seo_metadata.meta_title,
        meta_description=seo_metadata.meta_description,
        canonical_url=seo_metadata.canonical_url,
        robots=seo_metadata.robots,
        og_title=seo_metadata.og_title,
        og_description=seo_metadata.og_description,
        og_image_media_id=seo_metadata.og_image_media_id,
        schema_json=seo_metadata.schema_json,
    )


def _offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


def _validate_pagination(*, page: int, page_size: int) -> None:
    if page < 1:
        raise CmsServiceError("INVALID_PAGE", "Page must be greater than or equal to 1.", HTTPStatus.BAD_REQUEST)

    if page_size < 1 or page_size > 100:
        raise CmsServiceError("INVALID_PAGE_SIZE", "Page size must be between 1 and 100.", HTTPStatus.BAD_REQUEST)


def _validate_content_status(status: str) -> None:
    if status not in {"archived", "draft", "published"}:
        raise CmsServiceError("INVALID_CONTENT_STATUS", "Content status is invalid.", HTTPStatus.BAD_REQUEST)


def _validate_redirect_status_code(status_code: int) -> None:
    if status_code not in {301, 302, 307, 308}:
        raise CmsServiceError("INVALID_REDIRECT_STATUS", "Redirect status code is invalid.", HTTPStatus.BAD_REQUEST)


def _normalize_redirect_lookup_path(from_path: str) -> str:
    normalized = from_path.strip()
    if not normalized.startswith("/"):
        normalized = f"/{normalized}"
    return normalized


def _published_at_for_status(status: str, published_at: datetime | None) -> datetime | None:
    if status == "published":
        return published_at or datetime.now(UTC)
    return published_at


def _not_found(code: str, message: str) -> CmsServiceError:
    return CmsServiceError(code, message, HTTPStatus.NOT_FOUND)


def _conflict(code: str, message: str) -> CmsServiceError:
    return CmsServiceError(code, message, HTTPStatus.CONFLICT)


def _page_audit_data(page: Page) -> dict:
    return {
        "title": page.title,
        "slug": page.slug,
        "status": page.status,
        "published_at": page.published_at,
        "deleted_at": page.deleted_at,
    }


def _post_audit_data(post: Post) -> dict:
    return {
        "title": post.title,
        "slug": post.slug,
        "summary": post.summary,
        "status": post.status,
        "published_at": post.published_at,
        "deleted_at": post.deleted_at,
    }
