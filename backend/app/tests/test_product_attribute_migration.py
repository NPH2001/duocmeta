import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0006_product_attributes_schema.py"
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
    spec = importlib.util.spec_from_file_location("product_attribute_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_product_attribute_migration_creates_attribute_tables() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"product_attributes", "product_attribute_values"}
    assert (
        "ix_product_attributes_is_filterable",
        "product_attributes",
        ("is_filterable",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_product_attributes_is_variant_axis",
        "product_attributes",
        ("is_variant_axis",),
        False,
    ) in recorder.created_indexes
    assert (
        "ix_product_attribute_values_attribute_id",
        "product_attribute_values",
        ("attribute_id",),
        False,
    ) in recorder.created_indexes
    assert any(element.name == "uq_product_attributes_code" for element in recorder.created_tables["product_attributes"])
    assert any(
        element.name == "uq_product_attribute_values_attribute_id_value_code"
        for element in recorder.created_tables["product_attribute_values"]
    )


def test_product_attribute_migration_drops_values_before_attributes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["product_attribute_values", "product_attributes"]
    assert ("ix_product_attribute_values_attribute_id", "product_attribute_values") in recorder.dropped_indexes
    assert ("ix_product_attributes_is_filterable", "product_attributes") in recorder.dropped_indexes
