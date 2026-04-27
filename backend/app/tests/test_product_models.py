from app.models.base import Base
from app.models.catalog import Brand, Category, Product, ProductCategory
from app.models.identity import User


def test_product_tables_are_registered_on_metadata() -> None:
    assert {"products", "product_categories"}.issubset(Base.metadata.tables)


def test_product_model_matches_required_catalog_fields() -> None:
    products_table = Product.__table__
    index_names = {index.name for index in products_table.indexes}

    assert products_table.c.name.nullable is False
    assert products_table.c.slug.nullable is False
    assert products_table.c.sku.unique is True
    assert products_table.c.status.nullable is False
    assert products_table.c.product_type.nullable is False
    assert products_table.c.is_featured.nullable is False
    assert products_table.c.currency_code.nullable is False
    assert str(products_table.c.min_price.type) == "NUMERIC(18, 2)"
    assert str(products_table.c.max_price.type) == "NUMERIC(18, 2)"
    assert products_table.c.published_at.nullable is True
    assert products_table.c.deleted_at.nullable is True
    assert "ix_products_slug_active" in index_names
    assert "ix_products_status" in index_names
    assert "ix_products_published_at" in index_names


def test_product_model_supports_brand_and_audit_user_relationships() -> None:
    products_table = Product.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in products_table.foreign_keys}
    index_names = {index.name for index in products_table.indexes}

    assert products_table.c.brand_id.nullable is True
    assert str(foreign_keys["brand_id"].column) == "brands.id"
    assert foreign_keys["brand_id"].ondelete == "SET NULL"
    assert str(foreign_keys["created_by"].column) == "users.id"
    assert str(foreign_keys["updated_by"].column) == "users.id"
    assert Product.brand.property.back_populates == "products"
    assert Brand.products.property.back_populates == "brand"
    assert User.created_products.property.back_populates == "creator"
    assert User.updated_products.property.back_populates == "updater"
    assert "ix_products_brand_id" in index_names


def test_product_categories_join_table_supports_many_to_many_assignment() -> None:
    product_categories_table = ProductCategory.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in product_categories_table.foreign_keys}
    index_names = {index.name for index in product_categories_table.indexes}

    assert {column.name for column in product_categories_table.primary_key.columns} == {"product_id", "category_id"}
    assert product_categories_table.c.is_primary.nullable is False
    assert str(foreign_keys["product_id"].column) == "products.id"
    assert foreign_keys["product_id"].ondelete == "CASCADE"
    assert str(foreign_keys["category_id"].column) == "categories.id"
    assert foreign_keys["category_id"].ondelete == "CASCADE"
    assert Product.categories.property.back_populates == "product"
    assert Category.products.property.back_populates == "category"
    assert "ix_product_categories_category_id" in index_names
