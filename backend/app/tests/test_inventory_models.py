from app.models.base import Base
from app.models.catalog import InventorySnapshot, InventoryTransaction, ProductVariant
from app.models.identity import User


def test_inventory_tables_are_registered_on_metadata() -> None:
    assert {"inventory_snapshots", "inventory_transactions"}.issubset(Base.metadata.tables)


def test_inventory_snapshot_model_tracks_variant_quantities() -> None:
    snapshots_table = InventorySnapshot.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in snapshots_table.foreign_keys}

    assert {column.name for column in snapshots_table.primary_key.columns} == {"variant_id"}
    assert snapshots_table.c.available_quantity.nullable is False
    assert snapshots_table.c.reserved_quantity.nullable is False
    assert snapshots_table.c.updated_at.nullable is False
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "CASCADE"
    assert InventorySnapshot.variant.property.back_populates == "inventory_snapshot"
    assert ProductVariant.inventory_snapshot.property.back_populates == "variant"


def test_inventory_transaction_model_tracks_movement_metadata() -> None:
    transactions_table = InventoryTransaction.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in transactions_table.foreign_keys}
    index_names = {index.name for index in transactions_table.indexes}

    assert transactions_table.c.variant_id.nullable is False
    assert transactions_table.c.transaction_type.nullable is False
    assert transactions_table.c.quantity.nullable is False
    assert transactions_table.c.reference_type.nullable is False
    assert transactions_table.c.reference_id.nullable is True
    assert transactions_table.c.note.nullable is True
    assert transactions_table.c.created_by.nullable is True
    assert transactions_table.c.created_at.nullable is False
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "CASCADE"
    assert str(foreign_keys["created_by"].column) == "users.id"
    assert foreign_keys["created_by"].ondelete == "SET NULL"
    assert "ix_inventory_transactions_variant_id" in index_names
    assert "ix_inventory_transactions_transaction_type" in index_names
    assert "ix_inventory_transactions_reference" in index_names
    assert "ix_inventory_transactions_created_at" in index_names


def test_inventory_transaction_relationships_are_wired() -> None:
    assert InventoryTransaction.variant.property.back_populates == "inventory_transactions"
    assert ProductVariant.inventory_transactions.property.back_populates == "variant"
    assert InventoryTransaction.actor.property.back_populates == "inventory_transactions"
    assert User.inventory_transactions.property.back_populates == "actor"
