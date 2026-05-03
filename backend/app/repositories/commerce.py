from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.catalog import InventorySnapshot, InventoryTransaction, ProductVariant
from app.models.commerce import Cart, CartItem, Order, OrderItem


class CommerceRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_active_cart_for_user(self, user_id: UUID) -> Cart | None:
        return self.session.scalar(_cart_statement().where(Cart.user_id == user_id, Cart.status == "active"))

    def get_active_cart_for_session(self, session_id: str) -> Cart | None:
        return self.session.scalar(_cart_statement().where(Cart.session_id == session_id, Cart.status == "active"))

    def add_cart(self, cart: Cart) -> Cart:
        self.session.add(cart)
        self.session.flush()
        return cart

    def get_cart_item(self, cart_id: UUID, item_id: UUID) -> CartItem | None:
        statement = (
            select(CartItem)
            .where(CartItem.id == item_id, CartItem.cart_id == cart_id)
            .options(selectinload(CartItem.variant).selectinload(ProductVariant.product))
        )
        return self.session.scalar(statement)

    def get_cart_item_by_variant(self, cart_id: UUID, variant_id: UUID) -> CartItem | None:
        return self.session.scalar(
            select(CartItem).where(CartItem.cart_id == cart_id, CartItem.variant_id == variant_id)
        )

    def add_cart_item(self, cart_item: CartItem) -> CartItem:
        self.session.add(cart_item)
        self.session.flush()
        return cart_item

    def delete_cart_item(self, cart_item: CartItem) -> None:
        self.session.delete(cart_item)

    def get_order_by_idempotency_key(self, idempotency_key: str) -> Order | None:
        return self.session.scalar(_order_statement().where(Order.idempotency_key == idempotency_key))

    def list_orders_for_user(self, user_id: UUID, *, offset: int, limit: int) -> tuple[list[Order], int]:
        base_statement = select(Order).where(Order.user_id == user_id)
        rows = list(
            self.session.scalars(
                base_statement.options(selectinload(Order.items))
                .order_by(Order.created_at.desc())
                .offset(offset)
                .limit(limit)
            )
        )
        total = self.session.scalar(select(func.count()).select_from(base_statement.subquery())) or 0
        return rows, total

    def list_orders(self, *, offset: int, limit: int) -> tuple[list[Order], int]:
        base_statement = select(Order)
        rows = list(
            self.session.scalars(
                base_statement.options(selectinload(Order.items))
                .order_by(Order.created_at.desc())
                .offset(offset)
                .limit(limit)
            )
        )
        total = self.session.scalar(select(func.count()).select_from(base_statement.subquery())) or 0
        return rows, total

    def get_order_for_user_by_code(self, user_id: UUID, order_code: str) -> Order | None:
        return self.session.scalar(_order_statement().where(Order.user_id == user_id, Order.order_code == order_code))

    def get_order_by_code(self, order_code: str) -> Order | None:
        return self.session.scalar(_order_statement().where(Order.order_code == order_code))

    def get_order_code_exists(self, order_code: str) -> bool:
        return self.session.scalar(select(Order.id).where(Order.order_code == order_code)) is not None

    def add_order(self, order: Order) -> Order:
        self.session.add(order)
        self.session.flush()
        return order

    def add_order_item(self, order_item: OrderItem) -> OrderItem:
        self.session.add(order_item)
        self.session.flush()
        return order_item

    def add_inventory_transaction(self, transaction: InventoryTransaction) -> InventoryTransaction:
        self.session.add(transaction)
        self.session.flush()
        return transaction

    def get_inventory_snapshot_for_update(self, variant_id: UUID) -> InventorySnapshot | None:
        statement = select(InventorySnapshot).where(InventorySnapshot.variant_id == variant_id).with_for_update()
        return self.session.scalar(statement)

    def get_variant_for_cart(self, variant_id: UUID) -> ProductVariant | None:
        statement = (
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .options(
                selectinload(ProductVariant.product),
                selectinload(ProductVariant.inventory_snapshot),
            )
        )
        return self.session.scalar(statement)


def _cart_statement():
    return select(Cart).options(
        selectinload(Cart.items).selectinload(CartItem.variant).selectinload(ProductVariant.product),
        selectinload(Cart.items).selectinload(CartItem.variant).selectinload(ProductVariant.inventory_snapshot),
    )


def _order_statement():
    return select(Order).options(
        selectinload(Order.cart),
        selectinload(Order.items),
        selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.inventory_snapshot),
    )
