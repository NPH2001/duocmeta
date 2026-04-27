from decimal import Decimal
from http import HTTPStatus

from sqlalchemy.orm import Session

from app.models.catalog import ProductVariant
from app.models.commerce import Cart, CartItem
from app.models.identity import User
from app.repositories.commerce import CommerceRepository
from app.schemas.commerce import (
    CheckoutPreviewItemResponse,
    CheckoutPreviewRequest,
    CheckoutPreviewResponse,
)
from app.services.commerce import CommerceServiceError
from app.services.coupons import CouponService, CouponServiceError


class CheckoutPreviewService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CommerceRepository(session)

    def preview(
        self,
        *,
        request: CheckoutPreviewRequest,
        user: User | None,
        session_id: str | None,
    ) -> CheckoutPreviewResponse:
        cart = self._get_existing_cart(user=user, session_id=session_id)
        if not cart.items:
            raise CommerceServiceError("CART_EMPTY", "Cart has no items to preview.", HTTPStatus.BAD_REQUEST)

        subtotal = Decimal("0.00")
        currency_code = cart.items[0].variant.product.currency_code
        items: list[CheckoutPreviewItemResponse] = []
        warnings: list[str] = []

        for cart_item in sorted(cart.items, key=lambda item: item.created_at):
            variant = _ensure_cart_item_purchasable(cart_item)
            _ensure_inventory_available(variant, cart_item.quantity)

            if variant.product.currency_code != currency_code:
                raise CommerceServiceError(
                    "CART_CURRENCY_MISMATCH",
                    "Cart contains mixed currencies.",
                    HTTPStatus.CONFLICT,
                )

            line_total = variant.price * cart_item.quantity
            subtotal += line_total
            items.append(
                CheckoutPreviewItemResponse(
                    cart_item_id=cart_item.id,
                    product_id=variant.product_id,
                    variant_id=variant.id,
                    product_name=variant.product.name,
                    sku=variant.sku,
                    quantity=cart_item.quantity,
                    unit_price=variant.price,
                    line_total_amount=line_total,
                )
            )

        discount_amount, normalized_coupon_code = self._coupon_discount(
            coupon_code=request.coupon_code,
            subtotal=subtotal,
            user=user,
            warnings=warnings,
        )
        shipping_amount = _shipping_amount(request.shipping_method)
        tax_amount = Decimal("0.00")
        total_amount = max(subtotal - discount_amount + shipping_amount + tax_amount, Decimal("0.00"))

        return CheckoutPreviewResponse(
            currency_code=currency_code,
            subtotal_amount=subtotal,
            discount_amount=discount_amount,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            coupon_code=normalized_coupon_code,
            validation_warnings=warnings,
            items=items,
        )

    def _get_existing_cart(self, *, user: User | None, session_id: str | None) -> Cart:
        if user is not None:
            cart = self.repository.get_active_cart_for_user(user.id)
        else:
            if not session_id:
                raise CommerceServiceError(
                    "CART_SESSION_REQUIRED",
                    "Cart session id is required.",
                    HTTPStatus.BAD_REQUEST,
                )
            cart = self.repository.get_active_cart_for_session(session_id)

        if cart is None:
            raise CommerceServiceError("CART_NOT_FOUND", "Cart was not found.", HTTPStatus.NOT_FOUND)
        return cart

    def _coupon_discount(
        self,
        *,
        coupon_code: str | None,
        subtotal: Decimal,
        user: User | None,
        warnings: list[str],
    ) -> tuple[Decimal, str | None]:
        if coupon_code is None or not coupon_code.strip():
            return Decimal("0.00"), None

        normalized_coupon_code = coupon_code.strip().upper()
        try:
            validation_result = CouponService(self.session).validate_coupon(
                code=normalized_coupon_code,
                order_subtotal=subtotal,
                user_id=user.id if user is not None else None,
            )
        except CouponServiceError as exc:
            warnings.append(exc.message)
            return Decimal("0.00"), normalized_coupon_code

        return validation_result.discount_amount, validation_result.coupon.code


def _ensure_cart_item_purchasable(cart_item: CartItem) -> ProductVariant:
    variant = cart_item.variant
    if variant.status != "active":
        raise CommerceServiceError("VARIANT_NOT_FOUND", "Product variant was not found.", HTTPStatus.NOT_FOUND)

    product = variant.product
    if product.status != "active" or product.deleted_at is not None or product.published_at is None:
        raise CommerceServiceError("VARIANT_NOT_FOUND", "Product variant was not found.", HTTPStatus.NOT_FOUND)

    return variant


def _ensure_inventory_available(variant: ProductVariant, requested_quantity: int) -> None:
    snapshot = variant.inventory_snapshot
    available_quantity = 0 if snapshot is None else snapshot.available_quantity - snapshot.reserved_quantity

    if available_quantity < requested_quantity:
        raise CommerceServiceError(
            "INSUFFICIENT_INVENTORY",
            "Insufficient inventory is available.",
            HTTPStatus.CONFLICT,
        )


def _shipping_amount(shipping_method: str | None) -> Decimal:
    if shipping_method == "express":
        return Decimal("50000.00")
    return Decimal("0.00")
