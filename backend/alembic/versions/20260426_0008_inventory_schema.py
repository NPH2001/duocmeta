"""Add inventory schema.

Revision ID: 20260426_0008
Revises: 20260426_0007
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260426_0008"
down_revision = "20260426_0007"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "inventory_snapshots",
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("available_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("reserved_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_inventory_snapshots_variant_id_product_variants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("variant_id", name=op.f("pk_inventory_snapshots")),
    )

    op.create_table(
        "inventory_transactions",
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reference_type", sa.String(length=50), nullable=False),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name=op.f("fk_inventory_transactions_created_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_inventory_transactions_variant_id_product_variants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory_transactions")),
    )
    op.create_index("ix_inventory_transactions_created_at", "inventory_transactions", ["created_at"], unique=False)
    op.create_index(
        "ix_inventory_transactions_reference",
        "inventory_transactions",
        ["reference_type", "reference_id"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_transactions_transaction_type",
        "inventory_transactions",
        ["transaction_type"],
        unique=False,
    )
    op.create_index("ix_inventory_transactions_variant_id", "inventory_transactions", ["variant_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_inventory_transactions_variant_id", table_name="inventory_transactions")
    op.drop_index("ix_inventory_transactions_transaction_type", table_name="inventory_transactions")
    op.drop_index("ix_inventory_transactions_reference", table_name="inventory_transactions")
    op.drop_index("ix_inventory_transactions_created_at", table_name="inventory_transactions")
    op.drop_table("inventory_transactions")

    op.drop_table("inventory_snapshots")
