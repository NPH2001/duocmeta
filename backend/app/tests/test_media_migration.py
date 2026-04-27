import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260426_0004_media_files_schema.py"
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
    spec = importlib.util.spec_from_file_location("media_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_media_migration_creates_media_files_table() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {"media_files"}
    assert ("ix_media_files_mime_type", "media_files", ("mime_type",), False) in recorder.created_indexes
    assert ("ix_media_files_uploaded_by", "media_files", ("uploaded_by",), False) in recorder.created_indexes
    assert (
        "fk_brands_logo_media_id_media_files",
        "brands",
        "media_files",
        ("logo_media_id",),
        ("id",),
        "SET NULL",
    ) in recorder.created_foreign_keys
    assert any(element.name == "uq_media_files_storage_key" for element in recorder.created_tables["media_files"])
    assert any(element.name == "fk_media_files_uploaded_by_users" for element in recorder.created_tables["media_files"])


def test_media_migration_drops_media_files_schema() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_constraints == [("fk_brands_logo_media_id_media_files", "brands", "foreignkey")]
    assert recorder.dropped_indexes == [
        ("ix_media_files_uploaded_by", "media_files"),
        ("ix_media_files_mime_type", "media_files"),
    ]
    assert recorder.dropped_tables == ["media_files"]
