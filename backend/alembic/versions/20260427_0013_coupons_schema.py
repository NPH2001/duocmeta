"""Add coupons schema.

Revision ID: 20260427_0013
Revises: 20260427_0012
Create Date: 2026-04-27 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260427_0013"
down_revision = "20260427_0012"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("discount_type", sa.String(length=50), nullable=False),
        sa.Column("discount_value", sa.Numeric(18, 2), nullable=False),
        sa.Column("min_order_value", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_discount_value", sa.Numeric(18, 2), nullable=True),
        sa.Column("usage_limit_total", sa.Integer(), nullable=True),
        sa.Column("usage_limit_per_user", sa.Integer(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coupons")),
    )
    op.create_index("ix_coupons_code", "coupons", ["code"], unique=True)
    op.create_index("ix_coupons_is_active", "coupons", ["is_active"], unique=False)
    op.create_index("ix_coupons_starts_at", "coupons", ["starts_at"], unique=False)
    op.create_index("ix_coupons_ends_at", "coupons", ["ends_at"], unique=False)

    op.create_table(
        "coupon_usages",
        sa.Column("coupon_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("discount_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["coupon_id"],
            ["coupons.id"],
            name=op.f("fk_coupon_usages_coupon_id_coupons"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_coupon_usages_order_id_orders"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_coupon_usages_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coupon_usages")),
        sa.UniqueConstraint("coupon_id", "order_id", name="uq_coupon_usages_coupon_id_order_id"),
    )
    op.create_index("ix_coupon_usages_coupon_id", "coupon_usages", ["coupon_id"], unique=False)
    op.create_index("ix_coupon_usages_order_id", "coupon_usages", ["order_id"], unique=False)
    op.create_index("ix_coupon_usages_user_id", "coupon_usages", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_coupon_usages_user_id", table_name="coupon_usages")
    op.drop_index("ix_coupon_usages_order_id", table_name="coupon_usages")
    op.drop_index("ix_coupon_usages_coupon_id", table_name="coupon_usages")
    op.drop_table("coupon_usages")

    op.drop_index("ix_coupons_ends_at", table_name="coupons")
    op.drop_index("ix_coupons_starts_at", table_name="coupons")
    op.drop_index("ix_coupons_is_active", table_name="coupons")
    op.drop_index("ix_coupons_code", table_name="coupons")
    op.drop_table("coupons")
