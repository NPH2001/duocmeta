import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0005_products_core_schema.py"
)


class OperationRecorder:
    def __init__(self) -> None:
        self.created_tables: dict[str, tuple[object, ...]] = {}
        self.created_indexes: list[tuple[str, str, tuple[str, ...], bool, object | None]] = []
        self.dropped_tables: list[str] = []
        self.dropped_indexes: list[tuple[str, str | None]] = []

    def f(self, name: str) -> str:
        return name

    def create_table(self, name: str, *elements: object, **_: object) -> None:
        self.created_tables[name] = elements

    def create_index(
        self,
        name: str,
        table_name: str,
        columns: list[str],
        unique: bool = False,
        postgresql_where: object | None = None,
        **_: object,
    ) -> None:
        self.created_indexes.append((name, table_name, tuple(columns), unique, postgresql_where))

    def drop_index(self, name: str, table_name: str | None = None, **_: object) -> None:
        self.dropped_indexes.append((name, table_name))

    def drop_table(self, name: str, **_: object) -> None:
        self.dropped_tables.append(name)


def load_migration_module() -> object:
    spec = importlib.util.spec_from_file_location("product_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_product_migration_creates_products_and_join_table() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"products", "product_categories"}
    assert ("ix_products_status", "products", ("status",), False, None) in recorder.created_indexes
    assert ("ix_products_brand_id", "products", ("brand_id",), False, None) in recorder.created_indexes
    assert ("ix_products_published_at", "products", ("published_at",), False, None) in recorder.created_indexes
    assert any(
        index_name == "ix_products_slug_active"
        and table_name == "products"
        and columns == ("slug",)
        and unique is True
        and where is not None
        for index_name, table_name, columns, unique, where in recorder.created_indexes
    )
    assert ("ix_product_categories_category_id", "product_categories", ("category_id",), False, None) in recorder.created_indexes
    assert any(element.name == "uq_products_sku" for element in recorder.created_tables["products"])
    assert any(
        element.name == "uq_product_categories_product_id_category_id"
        for element in recorder.created_tables["product_categories"]
    )


def test_product_migration_drops_join_table_before_products() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["product_categories", "products"]
    assert ("ix_product_categories_category_id", "product_categories") in recorder.dropped_indexes
    assert ("ix_products_slug_active", "products") in recorder.dropped_indexes
