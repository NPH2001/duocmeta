import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260427_0012_payments_schema.py"
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
    spec = importlib.util.spec_from_file_location("payment_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_payment_migration_creates_payment_tables_and_indexes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"payments", "payment_events"}
    assert ("ix_payments_order_id", "payments", ("order_id",), True) in recorder.created_indexes
    assert ("ix_payments_provider_code", "payments", ("provider_code",), False) in recorder.created_indexes
    assert ("ix_payments_status", "payments", ("status",), False) in recorder.created_indexes
    assert (
        "ix_payments_transaction_reference",
        "payments",
        ("transaction_reference",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_payment_events_payment_id",
        "payment_events",
        ("payment_id",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_payment_events_event_type",
        "payment_events",
        ("event_type",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_payment_events_provider_event_id",
        "payment_events",
        ("provider_event_id",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_payment_events_created_at",
        "payment_events",
        ("created_at",),
        False,
    ) in recorder.created_indexes


def test_payment_migration_drops_events_before_payments() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["payment_events", "payments"]
    assert ("ix_payment_events_payment_id", "payment_events") in recorder.dropped_indexes
    assert ("ix_payment_events_provider_event_id", "payment_events") in recorder.dropped_indexes
    assert ("ix_payments_order_id", "payments") in recorder.dropped_indexes
