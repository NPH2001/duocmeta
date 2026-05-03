import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from http import HTTPStatus
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.catalog import InventoryTransaction, ProductVariant
from app.models.commerce import Cart, CartItem, Order, OrderItem
from app.models.identity import User
from app.repositories.commerce import CommerceRepository
from app.schemas.commerce import (
    CartItemProductResponse,
    CartItemResponse,
    CartItemVariantResponse,
    CartResponse,
    CustomerOrderDetailResponse,
    CustomerOrderListItemResponse,
    OrderItemResponse,
    OrderResponse,
)
from app.services.audit import AuditContext, AuditService


logger = get_logger(__name__)


class CommerceServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class PaginatedResult:
    rows: list
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        if self.total == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


class CommerceService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CommerceRepository(session)
        self.audit = AuditService(session)

    def get_cart(self, *, user: User | None, session_id: str | None) -> CartResponse:
        cart = self._get_or_create_cart(user=user, session_id=session_id)
        return _cart_response(cart)

    def add_item(self, *, user: User | None, session_id: str | None, variant_id: UUID, quantity: int) -> CartResponse:
        _ensure_positive_quantity(quantity)
        cart = self._get_or_create_cart(user=user, session_id=session_id)
        variant = self._get_purchasable_variant(variant_id)
        existing_item = self.repository.get_cart_item_by_variant(cart.id, variant.id)
        requested_quantity = quantity if existing_item is None else existing_item.quantity + quantity
        _ensure_inventory_available(variant, requested_quantity)

        if existing_item is None:
            self.repository.add_cart_item(CartItem(cart_id=cart.id, variant_id=variant.id, quantity=quantity))
        else:
            existing_item.quantity = requested_quantity

        self.session.commit()
        return _cart_response(self._reload_cart(cart))

    def update_item(self, *, user: User | None, session_id: str | None, item_id: UUID, quantity: int) -> CartResponse:
        _ensure_positive_quantity(quantity)
        cart = self._get_existing_cart(user=user, session_id=session_id)
        cart_item = self.repository.get_cart_item(cart.id, item_id)
        if cart_item is None:
            raise _not_found("CART_ITEM_NOT_FOUND", "Cart item was not found.")

        variant = self._get_purchasable_variant(cart_item.variant_id)
        _ensure_inventory_available(variant, quantity)
        cart_item.quantity = quantity

        self.session.commit()
        return _cart_response(self._reload_cart(cart))

    def remove_item(self, *, user: User | None, session_id: str | None, item_id: UUID) -> CartResponse:
        cart = self._get_existing_cart(user=user, session_id=session_id)
        cart_item = self.repository.get_cart_item(cart.id, item_id)
        if cart_item is None:
            raise _not_found("CART_ITEM_NOT_FOUND", "Cart item was not found.")

        self.repository.delete_cart_item(cart_item)
        self.session.commit()
        return _cart_response(self._reload_cart(cart))

    def place_order(
        self,
        *,
        user: User | None,
        session_id: str | None,
        idempotency_key: str,
        email: str | None,
        phone: str | None,
        notes: str | None,
    ) -> tuple[OrderResponse, bool]:
        idempotency_key = idempotency_key.strip()
        if not idempotency_key:
            raise CommerceServiceError(
                "IDEMPOTENCY_KEY_REQUIRED",
                "Idempotency-Key header is required.",
                HTTPStatus.BAD_REQUEST,
            )

        existing_order = self.repository.get_order_by_idempotency_key(idempotency_key)
        if existing_order is not None:
            if _idempotency_scope_matches(existing_order, user=user, session_id=session_id):
                return _order_response(existing_order), False

            raise CommerceServiceError(
                "IDEMPOTENCY_KEY_CONFLICT",
                "Idempotency key was already used for a different checkout context.",
                HTTPStatus.CONFLICT,
            )

        cart = self._get_existing_cart(user=user, session_id=session_id)
        if not cart.items:
            raise CommerceServiceError("CART_EMPTY", "Cart has no items to order.", HTTPStatus.BAD_REQUEST)

        order_email = email or (user.email if user is not None else None)
        order_phone = phone or (user.phone if user is not None else None)
        if not order_email:
            raise CommerceServiceError("ORDER_EMAIL_REQUIRED", "Order email is required.", HTTPStatus.BAD_REQUEST)
        if not order_phone:
            raise CommerceServiceError("ORDER_PHONE_REQUIRED", "Order phone is required.", HTTPStatus.BAD_REQUEST)

        subtotal = Decimal("0.00")
        currency_code = cart.items[0].variant.product.currency_code
        for item in cart.items:
            variant = self._ensure_cart_item_purchasable(item)
            locked_snapshot = self.repository.get_inventory_snapshot_for_update(variant.id)
            if locked_snapshot is not None:
                variant.inventory_snapshot = locked_snapshot
            if variant.product.currency_code != currency_code:
                raise CommerceServiceError(
                    "CART_CURRENCY_MISMATCH",
                    "Cart contains mixed currencies.",
                    HTTPStatus.CONFLICT,
                )
            _ensure_inventory_available(variant, item.quantity)
            subtotal += variant.price * item.quantity

        order = self.repository.add_order(
            Order(
                order_code=self._generate_order_code(),
                idempotency_key=idempotency_key,
                user_id=user.id if user is not None else None,
                cart_id=cart.id,
                email=order_email,
                phone=order_phone,
                status="pending_payment",
                payment_status="pending",
                fulfillment_status="unfulfilled",
                currency_code=currency_code,
                subtotal_amount=subtotal,
                discount_amount=Decimal("0.00"),
                shipping_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                grand_total_amount=subtotal,
                notes=notes,
                placed_at=datetime.now(UTC),
            )
        )

        for item in cart.items:
            variant = item.variant
            line_total = variant.price * item.quantity
            self.repository.add_order_item(
                OrderItem(
                    order_id=order.id,
                    product_id=variant.product_id,
                    variant_id=variant.id,
                    product_name=variant.product.name,
                    variant_name=None,
                    sku=variant.sku,
                    unit_price=variant.price,
                    quantity=item.quantity,
                    line_total_amount=line_total,
                )
            )
            variant.inventory_snapshot.reserved_quantity += item.quantity
            self.repository.add_inventory_transaction(
                InventoryTransaction(
                    variant_id=variant.id,
                    transaction_type="reserve",
                    quantity=item.quantity,
                    reference_type="order",
                    reference_id=order.id,
                    note="Reserved by place-order flow.",
                    created_by=user.id if user is not None else None,
                )
            )

        cart.status = "ordered"
        self.session.commit()
        logger.info("order_placed order_id=%s cart_id=%s", order.id, cart.id)
        return _order_response(self.repository.get_order_by_idempotency_key(idempotency_key)), True

    def list_customer_orders(self, *, user: User, page: int, page_size: int) -> PaginatedResult:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        rows, total = self.repository.list_orders_for_user(user.id, offset=(page - 1) * page_size, limit=page_size)
        return PaginatedResult(
            rows=[_customer_order_list_item_response(order) for order in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_customer_order(self, *, user: User, order_code: str) -> CustomerOrderDetailResponse:
        order = self.repository.get_order_for_user_by_code(user.id, order_code)
        if order is None:
            raise _not_found("ORDER_NOT_FOUND", "Order was not found.")

        return _customer_order_detail_response(order)

    def list_admin_orders(self, *, page: int, page_size: int) -> PaginatedResult:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        rows, total = self.repository.list_orders(offset=(page - 1) * page_size, limit=page_size)
        return PaginatedResult(
            rows=[_customer_order_list_item_response(order) for order in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_admin_order(self, *, order_code: str) -> CustomerOrderDetailResponse:
        return _customer_order_detail_response(self._get_order_by_code(order_code))

    def confirm_admin_order(
        self,
        *,
        actor: User,
        order_code: str,
        audit_context: AuditContext | None = None,
    ) -> CustomerOrderDetailResponse:
        order = self._get_order_by_code(order_code)
        if order.status != "paid" or order.payment_status != "paid":
            raise CommerceServiceError(
                "ORDER_CONFIRM_INVALID_STATE",
                "Only paid orders can be confirmed.",
                HTTPStatus.CONFLICT,
            )

        old_data = _order_audit_data(order)
        order.status = "awaiting_fulfillment"
        order.fulfillment_status = "unfulfilled"
        self._record_order_audit(
            order=order,
            actor=actor,
            audit_context=audit_context,
            action_code="order.confirm",
            old_data=old_data,
        )
        self.session.commit()
        logger.info("admin_order_confirmed order_id=%s actor_id=%s", order.id, actor.id)
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def ship_admin_order(
        self,
        *,
        actor: User,
        order_code: str,
        audit_context: AuditContext | None = None,
    ) -> CustomerOrderDetailResponse:
        order = self._get_order_by_code(order_code)
        if order.status != "awaiting_fulfillment" or order.fulfillment_status != "unfulfilled":
            raise CommerceServiceError(
                "ORDER_SHIP_INVALID_STATE",
                "Only unfulfilled confirmed orders can be shipped.",
                HTTPStatus.CONFLICT,
            )

        old_data = _order_audit_data(order)
        order.status = "shipped"
        order.fulfillment_status = "shipped"
        self._record_order_audit(
            order=order,
            actor=actor,
            audit_context=audit_context,
            action_code="order.ship",
            old_data=old_data,
        )
        self.session.commit()
        logger.info("admin_order_shipped order_id=%s actor_id=%s", order.id, actor.id)
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def deliver_admin_order(
        self,
        *,
        actor: User,
        order_code: str,
        audit_context: AuditContext | None = None,
    ) -> CustomerOrderDetailResponse:
        order = self._get_order_by_code(order_code)
        if order.status != "shipped" or order.fulfillment_status != "shipped":
            raise CommerceServiceError(
                "ORDER_DELIVER_INVALID_STATE",
                "Only shipped orders can be delivered.",
                HTTPStatus.CONFLICT,
            )

        old_data = _order_audit_data(order)
        order.status = "completed"
        order.fulfillment_status = "delivered"
        order.completed_at = datetime.now(UTC)
        self._record_order_audit(
            order=order,
            actor=actor,
            audit_context=audit_context,
            action_code="order.deliver",
            old_data=old_data,
        )
        self.session.commit()
        logger.info("admin_order_delivered order_id=%s actor_id=%s", order.id, actor.id)
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def cancel_customer_order(self, *, user: User, order_code: str) -> CustomerOrderDetailResponse:
        order = self.repository.get_order_for_user_by_code(user.id, order_code)
        if order is None:
            raise _not_found("ORDER_NOT_FOUND", "Order was not found.")

        if order.status not in {"pending_payment", "awaiting_confirmation"} or order.payment_status != "pending":
            raise CommerceServiceError("ORDER_NOT_CANCELABLE", "Order cannot be cancelled.", HTTPStatus.CONFLICT)

        order.status = "cancelled"
        order.cancelled_at = datetime.now(UTC)

        for item in order.items:
            snapshot = item.variant.inventory_snapshot
            if snapshot is not None:
                snapshot.reserved_quantity = max(snapshot.reserved_quantity - item.quantity, 0)
                self.repository.add_inventory_transaction(
                    InventoryTransaction(
                        variant_id=item.variant_id,
                        transaction_type="release",
                        quantity=item.quantity,
                        reference_type="order",
                        reference_id=order.id,
                        note="Released by customer order cancellation.",
                        created_by=user.id,
                    )
                )

        self.session.commit()
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def cancel_admin_order(
        self,
        *,
        actor: User,
        order_code: str,
        audit_context: AuditContext | None = None,
    ) -> CustomerOrderDetailResponse:
        order = self._get_order_by_code(order_code)
        if order.fulfillment_status != "unfulfilled" or order.status in {"cancelled", "completed", "refunded"}:
            raise CommerceServiceError(
                "ORDER_CANCEL_INVALID_STATE",
                "Only unfulfilled open orders can be cancelled.",
                HTTPStatus.CONFLICT,
            )

        old_data = _order_audit_data(order)
        order.status = "cancelled"
        order.cancelled_at = datetime.now(UTC)
        if order.payment_status == "pending":
            order.payment_status = "cancelled"
        self._release_order_reservations(order, actor=actor, note="Released by admin order cancellation.")
        self._record_order_audit(
            order=order,
            actor=actor,
            audit_context=audit_context,
            action_code="order.cancel",
            old_data=old_data,
        )
        self.session.commit()
        logger.info("admin_order_cancelled order_id=%s actor_id=%s", order.id, actor.id)
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def refund_admin_order(
        self,
        *,
        actor: User,
        order_code: str,
        audit_context: AuditContext | None = None,
    ) -> CustomerOrderDetailResponse:
        order = self._get_order_by_code(order_code)
        if order.payment_status != "paid":
            raise CommerceServiceError(
                "ORDER_REFUND_INVALID_STATE",
                "Only paid orders can be refunded.",
                HTTPStatus.CONFLICT,
            )

        old_data = _order_audit_data(order)
        if order.fulfillment_status == "unfulfilled" and order.status != "cancelled":
            self._release_order_reservations(order, actor=actor, note="Released by admin order refund.")

        order.status = "refunded"
        order.payment_status = "refunded"
        self._record_order_audit(
            order=order,
            actor=actor,
            audit_context=audit_context,
            action_code="order.refund",
            old_data=old_data,
        )
        self.session.commit()
        logger.info("admin_order_refunded order_id=%s actor_id=%s", order.id, actor.id)
        self.session.refresh(order)
        return _customer_order_detail_response(order)

    def _get_or_create_cart(self, *, user: User | None, session_id: str | None) -> Cart:
        cart = self._find_cart(user=user, session_id=session_id)
        if cart is not None:
            return cart

        cart = Cart(user_id=user.id if user is not None else None, session_id=None if user is not None else session_id)
        self.repository.add_cart(cart)
        self.session.commit()
        return cart

    def _get_existing_cart(self, *, user: User | None, session_id: str | None) -> Cart:
        cart = self._find_cart(user=user, session_id=session_id)
        if cart is None:
            raise _not_found("CART_NOT_FOUND", "Cart was not found.")
        return cart

    def _find_cart(self, *, user: User | None, session_id: str | None) -> Cart | None:
        if user is not None:
            return self.repository.get_active_cart_for_user(user.id)

        if not session_id:
            raise CommerceServiceError("CART_SESSION_REQUIRED", "Cart session id is required.", HTTPStatus.BAD_REQUEST)

        return self.repository.get_active_cart_for_session(session_id)

    def _get_purchasable_variant(self, variant_id: UUID) -> ProductVariant:
        variant = self.repository.get_variant_for_cart(variant_id)
        if variant is None or variant.status != "active":
            raise _not_found("VARIANT_NOT_FOUND", "Product variant was not found.")

        product = variant.product
        if product.status != "active" or product.deleted_at is not None or product.published_at is None:
            raise _not_found("VARIANT_NOT_FOUND", "Product variant was not found.")

        return variant

    def _ensure_cart_item_purchasable(self, cart_item: CartItem) -> ProductVariant:
        variant = cart_item.variant
        if variant.status != "active":
            raise _not_found("VARIANT_NOT_FOUND", "Product variant was not found.")

        product = variant.product
        if product.status != "active" or product.deleted_at is not None or product.published_at is None:
            raise _not_found("VARIANT_NOT_FOUND", "Product variant was not found.")

        return variant

    def _generate_order_code(self) -> str:
        for _ in range(10):
            order_code = f"ORD-{uuid.uuid4().hex[:12].upper()}"
            if not self.repository.get_order_code_exists(order_code):
                return order_code

        raise CommerceServiceError(
            "ORDER_CODE_GENERATION_FAILED",
            "Could not generate order code.",
            HTTPStatus.CONFLICT,
        )

    def _reload_cart(self, cart: Cart) -> Cart:
        self.session.expire_all()
        return self._get_existing_cart(user=cart.user, session_id=cart.session_id)

    def _get_order_by_code(self, order_code: str) -> Order:
        order = self.repository.get_order_by_code(order_code)
        if order is None:
            raise _not_found("ORDER_NOT_FOUND", "Order was not found.")
        return order

    def _release_order_reservations(self, order: Order, *, actor: User, note: str) -> None:
        for item in order.items:
            snapshot = item.variant.inventory_snapshot
            if snapshot is not None:
                snapshot.reserved_quantity = max(snapshot.reserved_quantity - item.quantity, 0)
                self.repository.add_inventory_transaction(
                    InventoryTransaction(
                        variant_id=item.variant_id,
                        transaction_type="release",
                        quantity=item.quantity,
                        reference_type="order",
                        reference_id=order.id,
                        note=note,
                        created_by=actor.id,
                    )
                )

    def _record_order_audit(
        self,
        *,
        order: Order,
        actor: User,
        audit_context: AuditContext | None,
        action_code: str,
        old_data: dict,
    ) -> None:
        self.audit.record(
            context=audit_context or AuditContext(actor=actor),
            action_code=action_code,
            entity_type="order",
            entity_id=order.id,
            old_data=old_data,
            new_data=_order_audit_data(order),
        )


def _idempotency_scope_matches(order: Order, *, user: User | None, session_id: str | None) -> bool:
    if user is not None:
        return order.user_id == user.id

    return order.user_id is None and order.cart is not None and order.cart.session_id == session_id


def _cart_response(cart: Cart) -> CartResponse:
    return CartResponse(
        id=cart.id,
        status=cart.status,
        items=[
            CartItemResponse(
                id=item.id,
                quantity=item.quantity,
                product=CartItemProductResponse(
                    id=item.variant.product.id,
                    name=item.variant.product.name,
                    slug=item.variant.product.slug,
                    currency_code=item.variant.product.currency_code,
                ),
                variant=CartItemVariantResponse(
                    id=item.variant.id,
                    sku=item.variant.sku,
                    price=item.variant.price,
                ),
            )
            for item in sorted(cart.items, key=lambda item: item.created_at)
        ],
    )


def _order_response(order: Order | None) -> OrderResponse:
    if order is None:
        raise CommerceServiceError("ORDER_NOT_FOUND", "Order was not found.", HTTPStatus.NOT_FOUND)

    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        status=order.status,
        payment_status=order.payment_status,
        fulfillment_status=order.fulfillment_status,
        currency_code=order.currency_code,
        subtotal_amount=order.subtotal_amount,
        discount_amount=order.discount_amount,
        shipping_amount=order.shipping_amount,
        tax_amount=order.tax_amount,
        grand_total_amount=order.grand_total_amount,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                variant_name=item.variant_name,
                sku=item.sku,
                unit_price=item.unit_price,
                quantity=item.quantity,
                line_total_amount=item.line_total_amount,
            )
            for item in order.items
        ],
    )


def _customer_order_list_item_response(order: Order) -> CustomerOrderListItemResponse:
    return CustomerOrderListItemResponse(
        id=order.id,
        order_code=order.order_code,
        status=order.status,
        payment_status=order.payment_status,
        fulfillment_status=order.fulfillment_status,
        currency_code=order.currency_code,
        grand_total_amount=order.grand_total_amount,
        placed_at=order.placed_at,
        created_at=order.created_at,
    )


def _customer_order_detail_response(order: Order) -> CustomerOrderDetailResponse:
    base = _order_response(order).model_dump()
    return CustomerOrderDetailResponse(
        **base,
        placed_at=order.placed_at,
        cancelled_at=order.cancelled_at,
        completed_at=order.completed_at,
        created_at=order.created_at,
    )


def _ensure_positive_quantity(quantity: int) -> None:
    if quantity < 1:
        raise CommerceServiceError("INVALID_QUANTITY", "Quantity must be positive.", HTTPStatus.BAD_REQUEST)


def _ensure_inventory_available(variant: ProductVariant, requested_quantity: int) -> None:
    snapshot = variant.inventory_snapshot
    available_quantity = 0 if snapshot is None else snapshot.available_quantity - snapshot.reserved_quantity

    if available_quantity < requested_quantity:
        raise CommerceServiceError(
            "INSUFFICIENT_INVENTORY",
            "Insufficient inventory is available.",
            HTTPStatus.CONFLICT,
        )


def _order_audit_data(order: Order) -> dict:
    return {
        "order_code": order.order_code,
        "status": order.status,
        "payment_status": order.payment_status,
        "fulfillment_status": order.fulfillment_status,
        "grand_total_amount": order.grand_total_amount,
        "cancelled_at": order.cancelled_at,
        "completed_at": order.completed_at,
    }


def _not_found(code: str, message: str) -> CommerceServiceError:
    return CommerceServiceError(code, message, HTTPStatus.NOT_FOUND)
