import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0008_inventory_schema.py"
)


class OperationRecorder:
    def __init__(self) -> None:
        self.created_tables: dict[str, tuple[object, ...]] = {}
        self.created_indexes: list[tuple[str, str, tuple[str, ...], bool]] = []
        self.dropped_tables: list[str] = []
        self.dropped_indexes: list[tuple[str, str | None]] = []

    def f(self, name: str) -> str:
        return name

    def create_table(self, name: str, *elements: object, **_: object) -> None:
        self.created_tables[name] = elements

    def create_index(self, name: str, table_name: str, columns: list[str], unique: bool = False, **_: object) -> None:
        self.created_indexes.append((name, table_name, tuple(columns), unique))

    def drop_index(self, name: str, table_name: str | None = None, **_: object) -> None:
        self.dropped_indexes.append((name, table_name))

    def drop_table(self, name: str, **_: object) -> None:
        self.dropped_tables.append(name)


def load_migration_module() -> object:
    spec = importlib.util.spec_from_file_location("inventory_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_inventory_migration_creates_inventory_tables() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"inventory_snapshots", "inventory_transactions"}
    assert (
        "ix_inventory_transactions_variant_id",
        "inventory_transactions",
        ("variant_id",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_inventory_transactions_transaction_type",
        "inventory_transactions",
        ("transaction_type",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_inventory_transactions_reference",
        "inventory_transactions",
        ("reference_type", "reference_id"),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_inventory_transactions_created_at",
        "inventory_transactions",
        ("created_at",),
        False,
    ) in recorder.created_indexes


def test_inventory_migration_drops_transactions_before_snapshots() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["inventory_transactions", "inventory_snapshots"]
    assert ("ix_inventory_transactions_variant_id", "inventory_transactions") in recorder.dropped_indexes
    assert ("ix_inventory_transactions_reference", "inventory_transactions") in recorder.dropped_indexes
