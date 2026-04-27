import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0011_order_idempotency.py"
)


class OperationRecorder:
    def __init__(self) -> None:
        self.added_columns: list[tuple[str, object]] = []
        self.executed_sql: list[str] = []
        self.altered_columns: list[tuple[str, str, dict[str, object]]] = []
        self.created_indexes: list[tuple[str, str, tuple[str, ...], bool]] = []
        self.dropped_columns: list[tuple[str, str]] = []
        self.dropped_indexes: list[tuple[str, str | None]] = []

    def add_column(self, table_name: str, column: object, **_: object) -> None:
        self.added_columns.append((table_name, column))

    def execute(self, sql: str, **_: object) -> None:
        self.executed_sql.append(sql)

    def alter_column(self, table_name: str, column_name: str, **kwargs: object) -> None:
        self.altered_columns.append((table_name, column_name, kwargs))

    def create_index(self, name: str, table_name: str, columns: list[str], unique: bool = False, **_: object) -> None:
        self.created_indexes.append((name, table_name, tuple(columns), unique))

    def drop_index(self, name: str, table_name: str | None = None, **_: object) -> None:
        self.dropped_indexes.append((name, table_name))

    def drop_column(self, table_name: str, column_name: str, **_: object) -> None:
        self.dropped_columns.append((table_name, column_name))


def load_migration_module() -> object:
    spec = importlib.util.spec_from_file_location("order_idempotency_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_order_idempotency_migration_adds_key_and_unique_index() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert recorder.added_columns[0][0] == "orders"
    assert recorder.executed_sql == [
        "UPDATE orders SET idempotency_key = 'legacy-' || id::text WHERE idempotency_key IS NULL"
    ]
    assert ("ix_orders_idempotency_key", "orders", ("idempotency_key",), True) in recorder.created_indexes
    assert ("orders", "idempotency_key", {"nullable": False}) in recorder.altered_columns


def test_order_idempotency_migration_drops_index_before_column() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_indexes == [("ix_orders_idempotency_key", "orders")]
    assert recorder.dropped_columns == [("orders", "idempotency_key")]
