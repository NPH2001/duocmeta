"""Add media files schema.

Revision ID: 20260426_0004
Revises: 20260426_0003
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260426_0004"
down_revision = "20260426_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "media_files",
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["uploaded_by"],
            ["users.id"],
            name=op.f("fk_media_files_uploaded_by_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media_files")),
        sa.UniqueConstraint("storage_key", name=op.f("uq_media_files_storage_key")),
    )
    op.create_index("ix_media_files_mime_type", "media_files", ["mime_type"], unique=False)
    op.create_index("ix_media_files_uploaded_by", "media_files", ["uploaded_by"], unique=False)
    op.create_foreign_key(
        op.f("fk_brands_logo_media_id_media_files"),
        "brands",
        "media_files",
        ["logo_media_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_brands_logo_media_id_media_files"), "brands", type_="foreignkey")
    op.drop_index("ix_media_files_uploaded_by", table_name="media_files")
    op.drop_index("ix_media_files_mime_type", table_name="media_files")
    op.drop_table("media_files")
