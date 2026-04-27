import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


if TYPE_CHECKING:
    from app.models.catalog import MediaFile
    from app.models.identity import User


class Page(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "pages"
    __table_args__ = (
        Index("ix_pages_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_pages_status", "status"),
        Index("ix_pages_published_at", "published_at"),
        Index("ix_pages_created_by", "created_by"),
        Index("ix_pages_updated_by", "updated_by"),
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict[str, object]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    creator: Mapped["User | None"] = relationship(foreign_keys=[created_by], back_populates="created_pages")
    updater: Mapped["User | None"] = relationship(foreign_keys=[updated_by], back_populates="updated_pages")


class Post(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "posts"
    __table_args__ = (
        Index("ix_posts_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_posts_status", "status"),
        Index("ix_posts_published_at", "published_at"),
        Index("ix_posts_author_id", "author_id"),
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[dict[str, object]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    author: Mapped["User | None"] = relationship(back_populates="posts")
    tags: Mapped[list["PostTag"]] = relationship(back_populates="post")


class Tag(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        Index("ix_tags_slug", "slug", unique=True),
        Index("ix_tags_is_active", "is_active"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    posts: Mapped[list["PostTag"]] = relationship(back_populates="tag")


class PostTag(Base):
    __tablename__ = "post_tags"
    __table_args__ = (
        UniqueConstraint("post_id", "tag_id", name="uq_post_tags_post_id_tag_id"),
        Index("ix_post_tags_tag_id", "tag_id"),
    )

    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    )

    post: Mapped[Post] = relationship(back_populates="tags")
    tag: Mapped[Tag] = relationship(back_populates="posts")


class SeoMetadata(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "seo_metadata"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", name="uq_seo_metadata_entity_type_entity_id"),
        Index("ix_seo_metadata_entity", "entity_type", "entity_id"),
        Index("ix_seo_metadata_og_image_media_id", "og_image_media_id"),
    )

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    robots: Mapped[str | None] = mapped_column(String(100), nullable=True)
    og_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    og_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_image_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_files.id", ondelete="SET NULL"),
        nullable=True,
    )
    schema_json: Mapped[dict[str, object] | None] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True,
    )

    og_image_media: Mapped["MediaFile | None"] = relationship(foreign_keys=[og_image_media_id])


class Redirect(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "redirects"
    __table_args__ = (
        Index("ix_redirects_from_path", "from_path", unique=True),
        Index("ix_redirects_is_active", "is_active"),
    )

    from_path: Mapped[str] = mapped_column(String(500), nullable=False)
    to_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False, server_default="301")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
