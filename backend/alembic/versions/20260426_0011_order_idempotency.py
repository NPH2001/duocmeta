"""Add order idempotency key.

Revision ID: 20260426_0011
Revises: 20260426_0010
Create Date: 2026-04-26 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision = "20260426_0011"
down_revision = "20260426_0010"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("idempotency_key", sa.String(length=255), nullable=True))
    op.execute("UPDATE orders SET idempotency_key = 'legacy-' || id::text WHERE idempotency_key IS NULL")
    op.create_index("ix_orders_idempotency_key", "orders", ["idempotency_key"], unique=True)
    op.alter_column("orders", "idempotency_key", nullable=False)


def downgrade() -> None:
    op.drop_index("ix_orders_idempotency_key", table_name="orders")
    op.drop_column("orders", "idempotency_key")
