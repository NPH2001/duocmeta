from app.models.base import Base
from app.models.catalog import Product, ProductAttributeValue, ProductImage, ProductVariant, VariantAttributeValue


def test_product_variant_tables_are_registered_on_metadata() -> None:
    assert {"product_variants", "variant_attribute_values", "product_images"}.issubset(Base.metadata.tables)


def test_product_variant_model_matches_required_fields() -> None:
    variants_table = ProductVariant.__table__
    index_names = {index.name for index in variants_table.indexes}

    assert variants_table.c.product_id.nullable is False
    assert variants_table.c.sku.nullable is False
    assert variants_table.c.sku.unique is True
    assert variants_table.c.barcode.nullable is True
    assert str(variants_table.c.price.type) == "NUMERIC(18, 2)"
    assert variants_table.c.compare_at_price.nullable is True
    assert variants_table.c.cost_price.nullable is True
    assert variants_table.c.weight_grams.nullable is True
    assert variants_table.c.status.nullable is False
    assert variants_table.c.image_media_id.nullable is True
    assert "ix_product_variants_product_id" in index_names
    assert "ix_product_variants_status" in index_names


def test_product_variant_relationships_include_default_variant() -> None:
    products_table = Product.__table__
    variants_table = ProductVariant.__table__
    product_foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in products_table.foreign_keys}
    variant_foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in variants_table.foreign_keys}

    assert str(variant_foreign_keys["product_id"].column) == "products.id"
    assert variant_foreign_keys["product_id"].ondelete == "CASCADE"
    assert str(variant_foreign_keys["image_media_id"].column) == "media_files.id"
    assert variant_foreign_keys["image_media_id"].ondelete == "SET NULL"
    assert str(product_foreign_keys["default_variant_id"].column) == "product_variants.id"
    assert product_foreign_keys["default_variant_id"].ondelete == "SET NULL"
    assert Product.variants.property.back_populates == "product"
    assert ProductVariant.product.property.back_populates == "variants"


def test_variant_attribute_values_join_table_matches_required_fields() -> None:
    join_table = VariantAttributeValue.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in join_table.foreign_keys}
    unique_constraints = {constraint.name for constraint in join_table.constraints}

    assert {column.name for column in join_table.primary_key.columns} == {"variant_id", "attribute_value_id"}
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "CASCADE"
    assert str(foreign_keys["attribute_value_id"].column) == "product_attribute_values.id"
    assert foreign_keys["attribute_value_id"].ondelete == "CASCADE"
    assert ProductVariant.attribute_values.property.back_populates == "variant"
    assert ProductAttributeValue.variants.property.back_populates == "attribute_value"
    assert "uq_variant_attribute_values_variant_id_attribute_value_id" in unique_constraints


def test_product_image_model_matches_required_fields() -> None:
    images_table = ProductImage.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in images_table.foreign_keys}
    index_names = {index.name for index in images_table.indexes}

    assert images_table.c.product_id.nullable is False
    assert images_table.c.variant_id.nullable is True
    assert images_table.c.media_id.nullable is False
    assert images_table.c.sort_order.nullable is False
    assert images_table.c.is_primary.nullable is False
    assert str(foreign_keys["product_id"].column) == "products.id"
    assert foreign_keys["product_id"].ondelete == "CASCADE"
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "SET NULL"
    assert str(foreign_keys["media_id"].column) == "media_files.id"
    assert Product.images.property.back_populates == "product"
    assert ProductVariant.images.property.back_populates == "variant"
    assert "ix_product_images_product_id" in index_names
    assert "ix_product_images_variant_id" in index_names
    assert "ix_product_images_media_id" in index_names
