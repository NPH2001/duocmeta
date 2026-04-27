"""Add product variants schema.

Revision ID: 20260426_0007
Revises: 20260426_0006
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260426_0007"
down_revision = "20260426_0006"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_variants",
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("barcode", sa.String(length=100), nullable=True),
        sa.Column("price", sa.Numeric(18, 2), nullable=False),
        sa.Column("compare_at_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("cost_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("weight_grams", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="active", nullable=False),
        sa.Column("image_media_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["image_media_id"],
            ["media_files.id"],
            name=op.f("fk_product_variants_image_media_id_media_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_variants_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_variants")),
        sa.UniqueConstraint("sku", name=op.f("uq_product_variants_sku")),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"], unique=False)
    op.create_index("ix_product_variants_status", "product_variants", ["status"], unique=False)

    op.create_foreign_key(
        op.f("fk_products_default_variant_id_product_variants"),
        "products",
        "product_variants",
        ["default_variant_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "variant_attribute_values",
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attribute_value_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["attribute_value_id"],
            ["product_attribute_values.id"],
            name=op.f("fk_variant_attribute_values_attribute_value_id_product_attribute_values"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_variant_attribute_values_variant_id_product_variants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("variant_id", "attribute_value_id", name=op.f("pk_variant_attribute_values")),
        sa.UniqueConstraint(
            "variant_id",
            "attribute_value_id",
            name="uq_variant_attribute_values_variant_id_attribute_value_id",
        ),
    )

    op.create_table(
        "product_images",
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media_files.id"],
            name=op.f("fk_product_images_media_id_media_files"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_images_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_product_images_variant_id_product_variants"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_images")),
    )
    op.create_index("ix_product_images_media_id", "product_images", ["media_id"], unique=False)
    op.create_index("ix_product_images_product_id", "product_images", ["product_id"], unique=False)
    op.create_index("ix_product_images_sort_order", "product_images", ["sort_order"], unique=False)
    op.create_index("ix_product_images_variant_id", "product_images", ["variant_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_product_images_variant_id", table_name="product_images")
    op.drop_index("ix_product_images_sort_order", table_name="product_images")
    op.drop_index("ix_product_images_product_id", table_name="product_images")
    op.drop_index("ix_product_images_media_id", table_name="product_images")
    op.drop_table("product_images")

    op.drop_table("variant_attribute_values")

    op.drop_constraint(op.f("fk_products_default_variant_id_product_variants"), "products", type_="foreignkey")
    op.drop_index("ix_product_variants_status", table_name="product_variants")
    op.drop_index("ix_product_variants_product_id", table_name="product_variants")
    op.drop_table("product_variants")
