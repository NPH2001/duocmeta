from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.commerce import Coupon, CouponUsage


class CouponRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_coupon_by_code(self, code: str) -> Coupon | None:
        return self.session.scalar(select(Coupon).where(Coupon.code == code))

    def add_coupon(self, coupon: Coupon) -> Coupon:
        self.session.add(coupon)
        self.session.flush()
        return coupon

    def count_coupon_usages(self, coupon_id: UUID) -> int:
        return self.session.scalar(
            select(func.count()).select_from(CouponUsage).where(CouponUsage.coupon_id == coupon_id)
        ) or 0

    def count_coupon_usages_for_user(self, coupon_id: UUID, user_id: UUID) -> int:
        return self.session.scalar(
            select(func.count())
            .select_from(CouponUsage)
            .where(CouponUsage.coupon_id == coupon_id, CouponUsage.user_id == user_id)
        ) or 0
