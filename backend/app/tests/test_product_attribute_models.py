from app.models.base import Base
from app.models.catalog import ProductAttribute, ProductAttributeValue


def test_product_attribute_tables_are_registered_on_metadata() -> None:
    assert {"product_attributes", "product_attribute_values"}.issubset(Base.metadata.tables)


def test_product_attribute_model_matches_required_fields() -> None:
    attributes_table = ProductAttribute.__table__
    index_names = {index.name for index in attributes_table.indexes}

    assert attributes_table.c.code.nullable is False
    assert attributes_table.c.code.unique is True
    assert attributes_table.c.name.nullable is False
    assert attributes_table.c.input_type.nullable is False
    assert attributes_table.c.is_filterable.nullable is False
    assert attributes_table.c.is_variant_axis.nullable is False
    assert "ix_product_attributes_is_filterable" in index_names
    assert "ix_product_attributes_is_variant_axis" in index_names


def test_product_attribute_value_model_matches_required_fields() -> None:
    values_table = ProductAttributeValue.__table__
    index_names = {index.name for index in values_table.indexes}

    assert values_table.c.attribute_id.nullable is False
    assert values_table.c.value_code.nullable is False
    assert values_table.c.display_value.nullable is False
    assert values_table.c.sort_order.nullable is False
    assert "ix_product_attribute_values_attribute_id" in index_names
    assert "ix_product_attribute_values_sort_order" in index_names


def test_product_attribute_value_relationship_and_unique_scope() -> None:
    values_table = ProductAttributeValue.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in values_table.foreign_keys}
    unique_constraints = {constraint.name for constraint in values_table.constraints}

    assert str(foreign_keys["attribute_id"].column) == "product_attributes.id"
    assert foreign_keys["attribute_id"].ondelete == "CASCADE"
    assert ProductAttribute.values.property.back_populates == "attribute"
    assert ProductAttributeValue.attribute.property.back_populates == "values"
    assert "uq_product_attribute_values_attribute_id_value_code" in unique_constraints
