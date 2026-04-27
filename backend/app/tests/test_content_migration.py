import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260427_0014_content_seo_schema.py"
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
    spec = importlib.util.spec_from_file_location("content_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_content_migration_creates_content_seo_tables_and_indexes() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.upgrade()

    assert set(recorder.created_tables) == {
        "pages",
        "posts",
        "tags",
        "post_tags",
        "seo_metadata",
        "redirects",
    }
    assert ("ix_pages_slug_active", "pages", ("slug",), True) in recorder.created_indexes
    assert ("ix_pages_status", "pages", ("status",), False) in recorder.created_indexes
    assert ("ix_posts_slug_active", "posts", ("slug",), True) in recorder.created_indexes
    assert ("ix_posts_author_id", "posts", ("author_id",), False) in recorder.created_indexes
    assert ("ix_tags_slug", "tags", ("slug",), True) in recorder.created_indexes
    assert ("ix_post_tags_tag_id", "post_tags", ("tag_id",), False) in recorder.created_indexes
    assert ("ix_seo_metadata_entity", "seo_metadata", ("entity_type", "entity_id"), False) in recorder.created_indexes
    assert (
        "ix_seo_metadata_og_image_media_id",
        "seo_metadata",
        ("og_image_media_id",),
        False,
    ) in recorder.created_indexes
    assert ("ix_redirects_from_path", "redirects", ("from_path",), True) in recorder.created_indexes
    assert ("ix_redirects_is_active", "redirects", ("is_active",), False) in recorder.created_indexes


def test_content_migration_drops_dependent_tables_first() -> None:
    module = load_migration_module()
    recorder = OperationRecorder()
    module.op = recorder

    module.downgrade()

    assert recorder.dropped_tables == ["post_tags", "redirects", "seo_metadata", "tags", "posts", "pages"]
    assert ("ix_post_tags_tag_id", "post_tags") in recorder.dropped_indexes
    assert ("ix_seo_metadata_entity", "seo_metadata") in recorder.dropped_indexes
    assert ("ix_redirects_from_path", "redirects") in recorder.dropped_indexes
    assert ("ix_posts_slug_active", "posts") in recorder.dropped_indexes
    assert ("ix_pages_slug_active", "pages") in recorder.dropped_indexes
