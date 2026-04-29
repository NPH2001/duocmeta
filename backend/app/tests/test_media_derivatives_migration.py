import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260428_0015_media_derivatives_schema.py"
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
    spec = importlib.util.spec_from_file_location("media_derivatives_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_media_derivatives_migration_creates_table_and_indexes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"media_derivatives"}
    assert (
        "ix_media_derivatives_media_file_id",
        "media_derivatives",
        ("media_file_id",),
        False,
    ) in recorder.created_indexes
    assert ("ix_media_derivatives_status", "media_derivatives", ("status",), False) in recorder.created_indexes
    table_elements = recorder.created_tables["media_derivatives"]
    assert any(element.name == "fk_media_derivatives_media_file_id_media_files" for element in table_elements)
    assert any(element.name == "uq_media_derivatives_media_file_id_kind" for element in table_elements)
    assert any(element.name == "uq_media_derivatives_storage_key" for element in table_elements)


def test_media_derivatives_migration_drops_schema() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_indexes == [
        ("ix_media_derivatives_status", "media_derivatives"),
        ("ix_media_derivatives_media_file_id", "media_derivatives"),
    ]
    assert recorder.dropped_tables == ["media_derivatives"]
