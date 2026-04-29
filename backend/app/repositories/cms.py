from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.content import Page, Post, PostTag, Redirect, SeoMetadata, Tag


class CmsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_pages(self, *, offset: int, limit: int) -> tuple[list[Page], int]:
        return self._list_with_total(
            select(Page).where(Page.deleted_at.is_(None)).order_by(Page.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_page(self, page_id: UUID) -> Page | None:
        page = self.session.get(Page, page_id)
        if page is None or page.deleted_at is not None:
            return None
        return page

    def get_page_by_slug(self, slug: str) -> Page | None:
        return self.session.scalar(select(Page).where(Page.slug == slug, Page.deleted_at.is_(None)))

    def get_public_page_by_slug(self, *, slug: str, now: datetime) -> Page | None:
        return self.session.scalar(
            select(Page).where(
                Page.slug == slug,
                Page.status == "published",
                Page.deleted_at.is_(None),
                Page.published_at.is_not(None),
                Page.published_at <= now,
            )
        )

    def add_page(self, page: Page) -> Page:
        self.session.add(page)
        self.session.flush()
        return page

    def list_posts(self, *, offset: int, limit: int) -> tuple[list[Post], int]:
        return self._list_with_total(
            select(Post)
            .where(Post.deleted_at.is_(None))
            .options(selectinload(Post.tags))
            .order_by(Post.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_post(self, post_id: UUID) -> Post | None:
        statement = select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)).options(selectinload(Post.tags))
        return self.session.scalar(statement)

    def get_post_by_slug(self, slug: str) -> Post | None:
        return self.session.scalar(select(Post).where(Post.slug == slug, Post.deleted_at.is_(None)))

    def list_public_posts(self, *, offset: int, limit: int, now: datetime) -> tuple[list[Post], int]:
        return self._list_with_total(
            select(Post)
            .where(
                Post.status == "published",
                Post.deleted_at.is_(None),
                Post.published_at.is_not(None),
                Post.published_at <= now,
            )
            .options(selectinload(Post.tags))
            .order_by(Post.published_at.desc(), Post.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_public_post_by_slug(self, *, slug: str, now: datetime) -> Post | None:
        statement = (
            select(Post)
            .where(
                Post.slug == slug,
                Post.status == "published",
                Post.deleted_at.is_(None),
                Post.published_at.is_not(None),
                Post.published_at <= now,
            )
            .options(selectinload(Post.tags))
        )
        return self.session.scalar(statement)

    def add_post(self, post: Post) -> Post:
        self.session.add(post)
        self.session.flush()
        return post

    def set_post_tags(self, post: Post, tag_ids: list[UUID]) -> None:
        self.session.query(PostTag).filter(PostTag.post_id == post.id).delete(synchronize_session=False)

        for tag_id in tag_ids:
            self.session.add(PostTag(post_id=post.id, tag_id=tag_id))

        self.session.flush()

    def list_tags(self, *, offset: int, limit: int) -> tuple[list[Tag], int]:
        return self._list_with_total(select(Tag).order_by(Tag.created_at.desc()), offset=offset, limit=limit)

    def get_tag(self, tag_id: UUID) -> Tag | None:
        return self.session.get(Tag, tag_id)

    def get_tag_by_slug(self, slug: str) -> Tag | None:
        return self.session.scalar(select(Tag).where(Tag.slug == slug))

    def add_tag(self, tag: Tag) -> Tag:
        self.session.add(tag)
        self.session.flush()
        return tag

    def delete_tag(self, tag: Tag) -> None:
        self.session.delete(tag)

    def list_seo_metadata(self, *, offset: int, limit: int) -> tuple[list[SeoMetadata], int]:
        return self._list_with_total(
            select(SeoMetadata).order_by(SeoMetadata.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_seo_metadata(self, seo_metadata_id: UUID) -> SeoMetadata | None:
        return self.session.get(SeoMetadata, seo_metadata_id)

    def get_seo_metadata_by_entity(self, *, entity_type: str, entity_id: UUID) -> SeoMetadata | None:
        return self.session.scalar(
            select(SeoMetadata).where(SeoMetadata.entity_type == entity_type, SeoMetadata.entity_id == entity_id)
        )

    def add_seo_metadata(self, seo_metadata: SeoMetadata) -> SeoMetadata:
        self.session.add(seo_metadata)
        self.session.flush()
        return seo_metadata

    def delete_seo_metadata(self, seo_metadata: SeoMetadata) -> None:
        self.session.delete(seo_metadata)

    def list_redirects(self, *, offset: int, limit: int) -> tuple[list[Redirect], int]:
        return self._list_with_total(
            select(Redirect).order_by(Redirect.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_redirect(self, redirect_id: UUID) -> Redirect | None:
        return self.session.get(Redirect, redirect_id)

    def get_redirect_by_from_path(self, from_path: str) -> Redirect | None:
        return self.session.scalar(select(Redirect).where(Redirect.from_path == from_path))

    def get_active_redirect_by_from_path(self, from_path: str) -> Redirect | None:
        return self.session.scalar(
            select(Redirect).where(Redirect.from_path == from_path, Redirect.is_active.is_(True))
        )

    def add_redirect(self, redirect: Redirect) -> Redirect:
        self.session.add(redirect)
        self.session.flush()
        return redirect

    def delete_redirect(self, redirect: Redirect) -> None:
        self.session.delete(redirect)

    def _list_with_total(self, statement, *, offset: int, limit: int):
        total = self.session.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        rows = list(self.session.scalars(statement.offset(offset).limit(limit)).all())
        return rows, total
