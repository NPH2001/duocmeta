import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0009_cart_schema.py"
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
    spec = importlib.util.spec_from_file_location("cart_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_cart_migration_creates_cart_tables_and_indexes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"carts", "cart_items"}
    assert ("ix_carts_user_id", "carts", ("user_id",), False) in recorder.created_indexes
    assert ("ix_carts_session_id", "carts", ("session_id",), False) in recorder.created_indexes
    assert ("ix_carts_status", "carts", ("status",), False) in recorder.created_indexes
    assert ("ix_cart_items_cart_id", "cart_items", ("cart_id",), False) in recorder.created_indexes
    assert ("ix_cart_items_variant_id", "cart_items", ("variant_id",), False) in recorder.created_indexes


def test_cart_migration_drops_items_before_carts() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["cart_items", "carts"]
    assert ("ix_cart_items_variant_id", "cart_items") in recorder.dropped_indexes
    assert ("ix_cart_items_cart_id", "cart_items") in recorder.dropped_indexes
    assert ("ix_carts_user_id", "carts") in recorder.dropped_indexes
