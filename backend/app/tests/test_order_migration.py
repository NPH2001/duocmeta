import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0010_orders_schema.py"
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
    spec = importlib.util.spec_from_file_location("order_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_order_migration_creates_order_tables_and_indexes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"orders", "order_items"}
    assert ("ix_orders_order_code", "orders", ("order_code",), True) in recorder.created_indexes
    assert ("ix_orders_user_id", "orders", ("user_id",), False) in recorder.created_indexes
    assert ("ix_orders_cart_id", "orders", ("cart_id",), False) in recorder.created_indexes
    assert ("ix_orders_status", "orders", ("status",), False) in recorder.created_indexes
    assert ("ix_orders_payment_status", "orders", ("payment_status",), False) in recorder.created_indexes
    assert ("ix_orders_placed_at", "orders", ("placed_at",), False) in recorder.created_indexes
    assert ("ix_order_items_order_id", "order_items", ("order_id",), False) in recorder.created_indexes
    assert ("ix_order_items_product_id", "order_items", ("product_id",), False) in recorder.created_indexes
    assert ("ix_order_items_variant_id", "order_items", ("variant_id",), False) in recorder.created_indexes


def test_order_migration_drops_items_before_orders() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["order_items", "orders"]
    assert ("ix_order_items_variant_id", "order_items") in recorder.dropped_indexes
    assert ("ix_order_items_product_id", "order_items") in recorder.dropped_indexes
    assert ("ix_order_items_order_id", "order_items") in recorder.dropped_indexes
    assert ("ix_orders_order_code", "orders") in recorder.dropped_indexes
