"""Add content and SEO schema.

Revision ID: 20260427_0014
Revises: 20260427_0013
Create Date: 2026-04-27 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260427_0014"
down_revision = "20260427_0013"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


content_json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    op.create_table(
        "pages",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("content", content_json_type, nullable=False),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_pages_created_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], name=op.f("fk_pages_updated_by_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pages")),
    )
    op.create_index("ix_pages_created_by", "pages", ["created_by"], unique=False)
    op.create_index("ix_pages_published_at", "pages", ["published_at"], unique=False)
    op.create_index("ix_pages_slug_active", "pages", ["slug"], unique=True, postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("ix_pages_status", "pages", ["status"], unique=False)
    op.create_index("ix_pages_updated_by", "pages", ["updated_by"], unique=False)

    op.create_table(
        "posts",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", content_json_type, nullable=False),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], name=op.f("fk_posts_author_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_posts")),
    )
    op.create_index("ix_posts_author_id", "posts", ["author_id"], unique=False)
    op.create_index("ix_posts_published_at", "posts", ["published_at"], unique=False)
    op.create_index("ix_posts_slug_active", "posts", ["slug"], unique=True, postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("ix_posts_status", "posts", ["status"], unique=False)

    op.create_table(
        "tags",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tags")),
    )
    op.create_index("ix_tags_is_active", "tags", ["is_active"], unique=False)
    op.create_index("ix_tags_slug", "tags", ["slug"], unique=True)

    op.create_table(
        "seo_metadata",
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("meta_title", sa.String(length=255), nullable=True),
        sa.Column("meta_description", sa.String(length=500), nullable=True),
        sa.Column("canonical_url", sa.String(length=500), nullable=True),
        sa.Column("robots", sa.String(length=100), nullable=True),
        sa.Column("og_title", sa.String(length=255), nullable=True),
        sa.Column("og_description", sa.String(length=500), nullable=True),
        sa.Column("og_image_media_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("schema_json", content_json_type, nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["og_image_media_id"],
            ["media_files.id"],
            name=op.f("fk_seo_metadata_og_image_media_id_media_files"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_seo_metadata")),
        sa.UniqueConstraint("entity_type", "entity_id", name="uq_seo_metadata_entity_type_entity_id"),
    )
    op.create_index("ix_seo_metadata_entity", "seo_metadata", ["entity_type", "entity_id"], unique=False)
    op.create_index("ix_seo_metadata_og_image_media_id", "seo_metadata", ["og_image_media_id"], unique=False)

    op.create_table(
        "redirects",
        sa.Column("from_path", sa.String(length=500), nullable=False),
        sa.Column("to_path", sa.String(length=500), nullable=False),
        sa.Column("status_code", sa.Integer(), server_default="301", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_redirects")),
    )
    op.create_index("ix_redirects_from_path", "redirects", ["from_path"], unique=True)
    op.create_index("ix_redirects_is_active", "redirects", ["is_active"], unique=False)

    op.create_table(
        "post_tags",
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], name=op.f("fk_post_tags_post_id_posts"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], name=op.f("fk_post_tags_tag_id_tags"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "tag_id", name=op.f("pk_post_tags")),
        sa.UniqueConstraint("post_id", "tag_id", name="uq_post_tags_post_id_tag_id"),
    )
    op.create_index("ix_post_tags_tag_id", "post_tags", ["tag_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_post_tags_tag_id", table_name="post_tags")
    op.drop_table("post_tags")

    op.drop_index("ix_redirects_is_active", table_name="redirects")
    op.drop_index("ix_redirects_from_path", table_name="redirects")
    op.drop_table("redirects")

    op.drop_index("ix_seo_metadata_og_image_media_id", table_name="seo_metadata")
    op.drop_index("ix_seo_metadata_entity", table_name="seo_metadata")
    op.drop_table("seo_metadata")

    op.drop_index("ix_tags_slug", table_name="tags")
    op.drop_index("ix_tags_is_active", table_name="tags")
    op.drop_table("tags")

    op.drop_index("ix_posts_status", table_name="posts")
    op.drop_index("ix_posts_slug_active", table_name="posts", postgresql_where=sa.text("deleted_at IS NULL"))
    op.drop_index("ix_posts_published_at", table_name="posts")
    op.drop_index("ix_posts_author_id", table_name="posts")
    op.drop_table("posts")

    op.drop_index("ix_pages_updated_by", table_name="pages")
    op.drop_index("ix_pages_status", table_name="pages")
    op.drop_index("ix_pages_slug_active", table_name="pages", postgresql_where=sa.text("deleted_at IS NULL"))
    op.drop_index("ix_pages_published_at", table_name="pages")
    op.drop_index("ix_pages_created_by", table_name="pages")
    op.drop_table("pages")
