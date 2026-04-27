"""Add product attributes schema.

Revision ID: 20260426_0006
Revises: 20260426_0005
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260426_0006"
down_revision = "20260426_0005"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_attributes",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("input_type", sa.String(length=50), nullable=False),
        sa.Column("is_filterable", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_variant_axis", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_attributes")),
        sa.UniqueConstraint("code", name=op.f("uq_product_attributes_code")),
    )
    op.create_index("ix_product_attributes_is_filterable", "product_attributes", ["is_filterable"], unique=False)
    op.create_index("ix_product_attributes_is_variant_axis", "product_attributes", ["is_variant_axis"], unique=False)

    op.create_table(
        "product_attribute_values",
        sa.Column("attribute_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value_code", sa.String(length=100), nullable=False),
        sa.Column("display_value", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["attribute_id"],
            ["product_attributes.id"],
            name=op.f("fk_product_attribute_values_attribute_id_product_attributes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_attribute_values")),
        sa.UniqueConstraint("attribute_id", "value_code", name="uq_product_attribute_values_attribute_id_value_code"),
    )
    op.create_index("ix_product_attribute_values_attribute_id", "product_attribute_values", ["attribute_id"], unique=False)
    op.create_index("ix_product_attribute_values_sort_order", "product_attribute_values", ["sort_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_product_attribute_values_sort_order", table_name="product_attribute_values")
    op.drop_index("ix_product_attribute_values_attribute_id", table_name="product_attribute_values")
    op.drop_table("product_attribute_values")

    op.drop_index("ix_product_attributes_is_variant_axis", table_name="product_attributes")
    op.drop_index("ix_product_attributes_is_filterable", table_name="product_attributes")
    op.drop_table("product_attributes")
