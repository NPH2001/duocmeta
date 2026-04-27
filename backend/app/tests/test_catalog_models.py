from app.models.base import Base
from app.models.catalog import Brand, Category


def test_catalog_tables_are_registered_on_metadata() -> None:
    assert {"brands", "categories"}.issubset(Base.metadata.tables)


def test_brand_model_matches_required_catalog_fields() -> None:
    brands_table = Brand.__table__
    index_names = {index.name for index in brands_table.indexes}

    assert brands_table.c.name.nullable is False
    assert brands_table.c.slug.nullable is False
    assert brands_table.c.slug.unique is True
    assert brands_table.c.description.nullable is True
    assert brands_table.c.logo_media_id.nullable is True
    assert str(next(iter(brands_table.c.logo_media_id.foreign_keys)).column) == "media_files.id"
    assert brands_table.c.is_active.nullable is False
    assert brands_table.c.created_at.nullable is False
    assert brands_table.c.updated_at.nullable is False
    assert "ix_brands_is_active" in index_names


def test_category_model_supports_tree_relationship() -> None:
    categories_table = Category.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in categories_table.foreign_keys}
    index_names = {index.name for index in categories_table.indexes}

    assert categories_table.c.parent_id.nullable is True
    assert str(foreign_keys["parent_id"].column) == "categories.id"
    assert foreign_keys["parent_id"].ondelete == "SET NULL"
    assert Category.parent.property.back_populates == "children"
    assert Category.children.property.back_populates == "parent"
    assert "ix_categories_parent_id" in index_names


def test_category_model_matches_public_navigation_fields() -> None:
    categories_table = Category.__table__
    index_names = {index.name for index in categories_table.indexes}

    assert categories_table.c.name.nullable is False
    assert categories_table.c.slug.nullable is False
    assert categories_table.c.slug.unique is True
    assert categories_table.c.sort_order.nullable is False
    assert categories_table.c.is_active.nullable is False
    assert categories_table.c.created_at.nullable is False
    assert categories_table.c.updated_at.nullable is False
    assert "ix_categories_is_active" in index_names
    assert "ix_categories_sort_order" in index_names
