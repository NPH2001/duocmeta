"""Add media derivatives schema.

Revision ID: 20260428_0015
Revises: 20260427_0014
Create Date: 2026-04-28 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260428_0015"
down_revision = "20260427_0014"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "media_derivatives",
        sa.Column("media_file_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=50), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="pending", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["media_file_id"],
            ["media_files.id"],
            name=op.f("fk_media_derivatives_media_file_id_media_files"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media_derivatives")),
        sa.UniqueConstraint("media_file_id", "kind", name="uq_media_derivatives_media_file_id_kind"),
        sa.UniqueConstraint("storage_key", name=op.f("uq_media_derivatives_storage_key")),
    )
    op.create_index(
        "ix_media_derivatives_media_file_id",
        "media_derivatives",
        ["media_file_id"],
        unique=False,
    )
    op.create_index("ix_media_derivatives_status", "media_derivatives", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_media_derivatives_status", table_name="media_derivatives")
    op.drop_index("ix_media_derivatives_media_file_id", table_name="media_derivatives")
    op.drop_table("media_derivatives")
