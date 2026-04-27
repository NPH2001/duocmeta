"""Add products core schema.

Revision ID: 20260426_0005
Revises: 20260426_0004
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260426_0005"
down_revision = "20260426_0004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=True),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.Column("product_type", sa.String(length=50), server_default="simple", nullable=False),
        sa.Column("default_variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("currency_code", sa.String(length=3), server_default="VND", nullable=False),
        sa.Column("min_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], name=op.f("fk_products_brand_id_brands"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_products_created_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], name=op.f("fk_products_updated_by_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("sku", name=op.f("uq_products_sku")),
    )
    op.create_index("ix_products_brand_id", "products", ["brand_id"], unique=False)
    op.create_index("ix_products_published_at", "products", ["published_at"], unique=False)
    op.create_index("ix_products_slug_active", "products", ["slug"], unique=True, postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("ix_products_status", "products", ["status"], unique=False)

    op.create_table(
        "product_categories",
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name=op.f("fk_product_categories_category_id_categories"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_categories_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("product_id", "category_id", name=op.f("pk_product_categories")),
        sa.UniqueConstraint("product_id", "category_id", name="uq_product_categories_product_id_category_id"),
    )
    op.create_index("ix_product_categories_category_id", "product_categories", ["category_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_product_categories_category_id", table_name="product_categories")
    op.drop_table("product_categories")

    op.drop_index("ix_products_status", table_name="products")
    op.drop_index("ix_products_slug_active", table_name="products", postgresql_where=sa.text("deleted_at IS NULL"))
    op.drop_index("ix_products_published_at", table_name="products")
    op.drop_index("ix_products_brand_id", table_name="products")
    op.drop_table("products")
