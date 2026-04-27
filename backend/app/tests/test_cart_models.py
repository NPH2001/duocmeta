from app.models.base import Base
from app.models.catalog import ProductVariant
from app.models.commerce import Cart, CartItem
from app.models.identity import User


def test_cart_tables_are_registered_on_metadata() -> None:
    assert {"carts", "cart_items"}.issubset(Base.metadata.tables)


def test_cart_model_tracks_owner_or_guest_session() -> None:
    carts_table = Cart.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in carts_table.foreign_keys}
    index_names = {index.name for index in carts_table.indexes}

    assert carts_table.c.user_id.nullable is True
    assert carts_table.c.session_id.nullable is True
    assert carts_table.c.status.nullable is False
    assert carts_table.c.created_at.nullable is False
    assert carts_table.c.updated_at.nullable is False
    assert str(foreign_keys["user_id"].column) == "users.id"
    assert foreign_keys["user_id"].ondelete == "SET NULL"
    assert "ix_carts_user_id" in index_names
    assert "ix_carts_session_id" in index_names
    assert "ix_carts_status" in index_names


def test_cart_item_model_tracks_variant_quantity() -> None:
    items_table = CartItem.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in items_table.foreign_keys}
    index_names = {index.name for index in items_table.indexes}
    unique_names = {constraint.name for constraint in items_table.constraints}

    assert items_table.c.cart_id.nullable is False
    assert items_table.c.variant_id.nullable is False
    assert items_table.c.quantity.nullable is False
    assert items_table.c.created_at.nullable is False
    assert items_table.c.updated_at.nullable is False
    assert str(foreign_keys["cart_id"].column) == "carts.id"
    assert foreign_keys["cart_id"].ondelete == "CASCADE"
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "RESTRICT"
    assert "uq_cart_items_cart_id_variant_id" in unique_names
    assert "ix_cart_items_cart_id" in index_names
    assert "ix_cart_items_variant_id" in index_names


def test_cart_relationships_are_wired() -> None:
    assert Cart.user.property.back_populates == "carts"
    assert User.carts.property.back_populates == "user"
    assert Cart.items.property.back_populates == "cart"
    assert CartItem.cart.property.back_populates == "items"
    assert CartItem.variant.property.back_populates == "cart_items"
    assert ProductVariant.cart_items.property.back_populates == "variant"
