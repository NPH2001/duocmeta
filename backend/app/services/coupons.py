from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from http import HTTPStatus
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.commerce import Coupon
from app.repositories.coupons import CouponRepository
from app.schemas.coupons import CouponCreateRequest, CouponResponse, CouponValidationResult


class CouponServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class CouponService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CouponRepository(session)

    def create_coupon(self, request: CouponCreateRequest) -> CouponResponse:
        if self.repository.get_coupon_by_code(request.code) is not None:
            raise CouponServiceError("COUPON_CODE_EXISTS", "Coupon code already exists.", HTTPStatus.CONFLICT)

        _validate_coupon_definition(request)
        coupon = self.repository.add_coupon(Coupon(**request.model_dump()))
        self.session.commit()
        return CouponResponse.model_validate(coupon)

    def validate_coupon(
        self,
        *,
        code: str,
        order_subtotal: Decimal,
        user_id: UUID | None,
        now: datetime | None = None,
    ) -> CouponValidationResult:
        normalized_code = code.strip().upper()
        if not normalized_code:
            raise CouponServiceError("COUPON_CODE_REQUIRED", "Coupon code is required.", HTTPStatus.BAD_REQUEST)

        coupon = self.repository.get_coupon_by_code(normalized_code)
        if coupon is None:
            raise CouponServiceError("COUPON_NOT_FOUND", "Coupon was not found.", HTTPStatus.NOT_FOUND)

        validation_time = now or datetime.now(UTC)
        _ensure_coupon_is_eligible(coupon, order_subtotal=order_subtotal, now=validation_time)
        self._ensure_usage_limits(coupon, user_id=user_id)

        return CouponValidationResult(
            coupon=CouponResponse.model_validate(coupon),
            discount_amount=_calculate_discount(coupon, order_subtotal),
        )

    def _ensure_usage_limits(self, coupon: Coupon, *, user_id: UUID | None) -> None:
        if coupon.usage_limit_total is not None:
            total_usage_count = self.repository.count_coupon_usages(coupon.id)
            if total_usage_count >= coupon.usage_limit_total:
                raise CouponServiceError(
                    "COUPON_USAGE_LIMIT_REACHED",
                    "Coupon usage limit has been reached.",
                    HTTPStatus.CONFLICT,
                )

        if coupon.usage_limit_per_user is not None and user_id is not None:
            user_usage_count = self.repository.count_coupon_usages_for_user(coupon.id, user_id)
            if user_usage_count >= coupon.usage_limit_per_user:
                raise CouponServiceError(
                    "COUPON_USER_USAGE_LIMIT_REACHED",
                    "Coupon usage limit for this user has been reached.",
                    HTTPStatus.CONFLICT,
                )


def _validate_coupon_definition(request: CouponCreateRequest) -> None:
    if request.discount_type not in {"fixed_amount", "percent"}:
        raise CouponServiceError("INVALID_DISCOUNT_TYPE", "Discount type is invalid.", HTTPStatus.BAD_REQUEST)

    if request.discount_value <= 0:
        raise CouponServiceError("INVALID_DISCOUNT_VALUE", "Discount value must be positive.", HTTPStatus.BAD_REQUEST)

    if request.discount_type == "percent" and request.discount_value > 100:
        raise CouponServiceError(
            "INVALID_DISCOUNT_VALUE",
            "Percent discount cannot exceed 100.",
            HTTPStatus.BAD_REQUEST,
        )

    if request.min_order_value is not None and request.min_order_value < 0:
        raise CouponServiceError(
            "INVALID_MIN_ORDER_VALUE",
            "Minimum order value cannot be negative.",
            HTTPStatus.BAD_REQUEST,
        )

    if request.max_discount_value is not None and request.max_discount_value <= 0:
        raise CouponServiceError(
            "INVALID_MAX_DISCOUNT_VALUE",
            "Maximum discount must be positive.",
            HTTPStatus.BAD_REQUEST,
        )

    if request.usage_limit_total is not None and request.usage_limit_total < 1:
        raise CouponServiceError("INVALID_USAGE_LIMIT", "Total usage limit must be positive.", HTTPStatus.BAD_REQUEST)

    if request.usage_limit_per_user is not None and request.usage_limit_per_user < 1:
        raise CouponServiceError("INVALID_USAGE_LIMIT", "User usage limit must be positive.", HTTPStatus.BAD_REQUEST)

    if request.starts_at is not None and request.ends_at is not None and request.starts_at >= request.ends_at:
        raise CouponServiceError("INVALID_ACTIVE_WINDOW", "Coupon start must be before end.", HTTPStatus.BAD_REQUEST)


def _ensure_coupon_is_eligible(coupon: Coupon, *, order_subtotal: Decimal, now: datetime) -> None:
    if not coupon.is_active:
        raise CouponServiceError("COUPON_INACTIVE", "Coupon is inactive.", HTTPStatus.CONFLICT)

    if coupon.starts_at is not None and now < _ensure_aware(coupon.starts_at):
        raise CouponServiceError("COUPON_NOT_STARTED", "Coupon is not active yet.", HTTPStatus.CONFLICT)

    if coupon.ends_at is not None and now > _ensure_aware(coupon.ends_at):
        raise CouponServiceError("COUPON_EXPIRED", "Coupon has expired.", HTTPStatus.CONFLICT)

    if coupon.min_order_value is not None and order_subtotal < coupon.min_order_value:
        raise CouponServiceError(
            "COUPON_MIN_ORDER_NOT_MET",
            "Order subtotal does not meet coupon minimum.",
            HTTPStatus.CONFLICT,
        )


def _calculate_discount(coupon: Coupon, order_subtotal: Decimal) -> Decimal:
    if coupon.discount_type == "fixed_amount":
        discount = coupon.discount_value
    else:
        discount = order_subtotal * coupon.discount_value / Decimal("100")

    if coupon.max_discount_value is not None:
        discount = min(discount, coupon.max_discount_value)

    discount = min(discount, order_subtotal)
    return discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value
