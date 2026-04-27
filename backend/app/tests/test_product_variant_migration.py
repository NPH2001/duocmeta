import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0007_product_variants_schema.py"
)


class OperationRecorder:
    def __init__(self) -> None:
        self.created_tables: dict[str, tuple[object, ...]] = {}
        self.created_foreign_keys: list[tuple[str, str, str, tuple[str, ...], tuple[str, ...], str | None]] = []
        self.created_indexes: list[tuple[str, str, tuple[str, ...], bool]] = []
        self.dropped_constraints: list[tuple[str, str, str | None]] = []
        self.dropped_tables: list[str] = []
        self.dropped_indexes: list[tuple[str, str | None]] = []

    def f(self, name: str) -> str:
        return name

    def create_table(self, name: str, *elements: object, **_: object) -> None:
        self.created_tables[name] = elements

    def create_index(self, name: str, table_name: str, columns: list[str], unique: bool = False, **_: object) -> None:
        self.created_indexes.append((name, table_name, tuple(columns), unique))

    def create_foreign_key(
        self,
        name: str,
        source_table: str,
        referent_table: str,
        local_cols: list[str],
        remote_cols: list[str],
        ondelete: str | None = None,
        **_: object,
    ) -> None:
        self.created_foreign_keys.append(
            (name, source_table, referent_table, tuple(local_cols), tuple(remote_cols), ondelete)
        )

    def drop_constraint(self, name: str, table_name: str, type_: str | None = None, **_: object) -> None:
        self.dropped_constraints.append((name, table_name, type_))

    def drop_index(self, name: str, table_name: str | None = None, **_: object) -> None:
        self.dropped_indexes.append((name, table_name))

    def drop_table(self, name: str, **_: object) -> None:
        self.dropped_tables.append(name)


def load_migration_module() -> object:
    spec = importlib.util.spec_from_file_location("product_variant_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_product_variant_migration_creates_variant_tables() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {
        "product_images",
        "product_variants",
        "variant_attribute_values",
    }
    assert ("ix_product_variants_product_id", "product_variants", ("product_id",), False) in recorder.created_indexes
    assert ("ix_product_variants_status", "product_variants", ("status",), False) in recorder.created_indexes
    assert ("ix_product_images_product_id", "product_images", ("product_id",), False) in recorder.created_indexes
    assert ("ix_product_images_variant_id", "product_images", ("variant_id",), False) in recorder.created_indexes
    assert any(element.name == "uq_product_variants_sku" for element in recorder.created_tables["product_variants"])
    assert any(
        element.name == "uq_variant_attribute_values_variant_id_attribute_value_id"
        for element in recorder.created_tables["variant_attribute_values"]
    )
    assert (
        "fk_products_default_variant_id_product_variants",
        "products",
        "product_variants",
        ("default_variant_id",),
        ("id",),
        "SET NULL",
    ) in recorder.created_foreign_keys


def test_product_variant_migration_drops_schema_in_dependency_order() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["product_images", "variant_attribute_values", "product_variants"]
    assert ("fk_products_default_variant_id_product_variants", "products", "foreignkey") in recorder.dropped_constraints
    assert ("ix_product_variants_product_id", "product_variants") in recorder.dropped_indexes
