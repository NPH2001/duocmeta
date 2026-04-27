from sqlalchemy import Numeric

from app.models.base import Base
from app.models.catalog import Product, ProductVariant
from app.models.commerce import Cart, Order, OrderItem
from app.models.identity import User


def test_order_tables_are_registered_on_metadata() -> None:
    assert {"orders", "order_items"}.issubset(Base.metadata.tables)


def test_order_model_tracks_customer_statuses_and_totals() -> None:
    orders_table = Order.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in orders_table.foreign_keys}
    index_names = {index.name for index in orders_table.indexes}

    assert orders_table.c.order_code.nullable is False
    assert orders_table.c.idempotency_key.nullable is False
    assert orders_table.c.email.nullable is False
    assert orders_table.c.phone.nullable is False
    assert orders_table.c.status.nullable is False
    assert orders_table.c.payment_status.nullable is False
    assert orders_table.c.fulfillment_status.nullable is False
    assert orders_table.c.currency_code.nullable is False
    assert isinstance(orders_table.c.subtotal_amount.type, Numeric)
    assert orders_table.c.subtotal_amount.type.precision == 18
    assert orders_table.c.subtotal_amount.type.scale == 2
    assert orders_table.c.discount_amount.nullable is False
    assert orders_table.c.shipping_amount.nullable is False
    assert orders_table.c.tax_amount.nullable is False
    assert orders_table.c.grand_total_amount.nullable is False
    assert orders_table.c.placed_at.nullable is True
    assert orders_table.c.cancelled_at.nullable is True
    assert orders_table.c.completed_at.nullable is True
    assert orders_table.c.created_at.nullable is False
    assert orders_table.c.updated_at.nullable is False
    assert str(foreign_keys["user_id"].column) == "users.id"
    assert foreign_keys["user_id"].ondelete == "SET NULL"
    assert str(foreign_keys["cart_id"].column) == "carts.id"
    assert foreign_keys["cart_id"].ondelete == "SET NULL"
    assert "ix_orders_order_code" in index_names
    assert "ix_orders_idempotency_key" in index_names
    assert "ix_orders_user_id" in index_names
    assert "ix_orders_cart_id" in index_names
    assert "ix_orders_status" in index_names
    assert "ix_orders_payment_status" in index_names
    assert "ix_orders_placed_at" in index_names


def test_order_item_model_stores_purchase_snapshots() -> None:
    items_table = OrderItem.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in items_table.foreign_keys}
    index_names = {index.name for index in items_table.indexes}

    assert items_table.c.order_id.nullable is False
    assert items_table.c.product_id.nullable is False
    assert items_table.c.variant_id.nullable is False
    assert items_table.c.product_name.nullable is False
    assert items_table.c.variant_name.nullable is True
    assert items_table.c.sku.nullable is False
    assert items_table.c.unit_price.nullable is False
    assert items_table.c.unit_price.type.precision == 18
    assert items_table.c.unit_price.type.scale == 2
    assert items_table.c.quantity.nullable is False
    assert items_table.c.line_total_amount.nullable is False
    assert items_table.c.line_total_amount.type.precision == 18
    assert items_table.c.line_total_amount.type.scale == 2
    assert str(foreign_keys["order_id"].column) == "orders.id"
    assert foreign_keys["order_id"].ondelete == "CASCADE"
    assert str(foreign_keys["product_id"].column) == "products.id"
    assert foreign_keys["product_id"].ondelete == "RESTRICT"
    assert str(foreign_keys["variant_id"].column) == "product_variants.id"
    assert foreign_keys["variant_id"].ondelete == "RESTRICT"
    assert "ix_order_items_order_id" in index_names
    assert "ix_order_items_product_id" in index_names
    assert "ix_order_items_variant_id" in index_names


def test_order_relationships_are_wired() -> None:
    assert Order.user.property.back_populates == "orders"
    assert User.orders.property.back_populates == "user"
    assert Order.cart.property.back_populates == "orders"
    assert Cart.orders.property.back_populates == "cart"
    assert Order.items.property.back_populates == "order"
    assert OrderItem.order.property.back_populates == "items"
    assert OrderItem.product.property.back_populates == "order_items"
    assert Product.order_items.property.back_populates == "product"
    assert OrderItem.variant.property.back_populates == "order_items"
    assert ProductVariant.order_items.property.back_populates == "variant"
