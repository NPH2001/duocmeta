from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.commerce import Coupon, CouponUsage, Order
from app.models.identity import User
from app.services.coupons import CouponService, CouponServiceError


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    with session_factory() as db_session:
        yield db_session

    Base.metadata.drop_all(engine)


def test_validate_fixed_amount_coupon(session: Session) -> None:
    coupon = _seed_coupon(session, code="SAVE50", discount_type="fixed_amount", discount_value=Decimal("50000.00"))

    result = CouponService(session).validate_coupon(
        code=" save50 ",
        order_subtotal=Decimal("200000.00"),
        user_id=None,
    )

    assert result.coupon.id == coupon.id
    assert result.discount_amount == Decimal("50000.00")


def test_validate_percent_coupon_with_cap(session: Session) -> None:
    _seed_coupon(
        session,
        code="SALE20",
        discount_type="percent",
        discount_value=Decimal("20.00"),
        max_discount_value=Decimal("30000.00"),
    )

    result = CouponService(session).validate_coupon(
        code="SALE20",
        order_subtotal=Decimal("300000.00"),
        user_id=None,
    )

    assert result.discount_amount == Decimal("30000.00")


@pytest.mark.parametrize(
    ("coupon_kwargs", "expected_code"),
    [
        ({"is_active": False}, "COUPON_INACTIVE"),
        ({"starts_at": datetime.now(UTC) + timedelta(days=1)}, "COUPON_NOT_STARTED"),
        ({"ends_at": datetime.now(UTC) - timedelta(days=1)}, "COUPON_EXPIRED"),
        ({"min_order_value": Decimal("500000.00")}, "COUPON_MIN_ORDER_NOT_MET"),
    ],
)
def test_validate_coupon_rejects_ineligible_coupon(
    session: Session,
    coupon_kwargs: dict,
    expected_code: str,
) -> None:
    _seed_coupon(session, code="BLOCKED", **coupon_kwargs)

    with pytest.raises(CouponServiceError) as exc_info:
        CouponService(session).validate_coupon(
            code="BLOCKED",
            order_subtotal=Decimal("100000.00"),
            user_id=None,
        )

    assert exc_info.value.code == expected_code


def test_validate_coupon_rejects_total_usage_limit(session: Session) -> None:
    coupon = _seed_coupon(session, code="ONCE", usage_limit_total=1)
    user = _seed_user(session)
    order = _seed_order(session, user=user)
    session.add(CouponUsage(coupon_id=coupon.id, order_id=order.id, user_id=user.id, discount_amount=Decimal("1.00")))
    session.commit()

    with pytest.raises(CouponServiceError) as exc_info:
        CouponService(session).validate_coupon(
            code="ONCE",
            order_subtotal=Decimal("100000.00"),
            user_id=user.id,
        )

    assert exc_info.value.code == "COUPON_USAGE_LIMIT_REACHED"


def test_validate_coupon_rejects_per_user_usage_limit(session: Session) -> None:
    coupon = _seed_coupon(session, code="USERONCE", usage_limit_per_user=1)
    user = _seed_user(session)
    order = _seed_order(session, user=user)
    session.add(CouponUsage(coupon_id=coupon.id, order_id=order.id, user_id=user.id, discount_amount=Decimal("1.00")))
    session.commit()

    with pytest.raises(CouponServiceError) as exc_info:
        CouponService(session).validate_coupon(
            code="USERONCE",
            order_subtotal=Decimal("100000.00"),
            user_id=user.id,
        )

    assert exc_info.value.code == "COUPON_USER_USAGE_LIMIT_REACHED"


def _seed_coupon(
    session: Session,
    *,
    code: str,
    discount_type: str = "fixed_amount",
    discount_value: Decimal = Decimal("10000.00"),
    min_order_value: Decimal | None = None,
    max_discount_value: Decimal | None = None,
    usage_limit_total: int | None = None,
    usage_limit_per_user: int | None = None,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    is_active: bool = True,
) -> Coupon:
    coupon = Coupon(
        code=code,
        name=code,
        discount_type=discount_type,
        discount_value=discount_value,
        min_order_value=min_order_value,
        max_discount_value=max_discount_value,
        usage_limit_total=usage_limit_total,
        usage_limit_per_user=usage_limit_per_user,
        starts_at=starts_at,
        ends_at=ends_at,
        is_active=is_active,
    )
    session.add(coupon)
    session.commit()
    return coupon


def _seed_user(session: Session) -> User:
    user = User(email="customer@example.com", password_hash="hash", full_name="Customer")
    session.add(user)
    session.commit()
    return user


def _seed_order(session: Session, *, user: User) -> Order:
    order = Order(
        order_code="ORD-COUPON",
        idempotency_key="coupon-test",
        user_id=user.id,
        email=user.email,
        phone="0900000000",
        status="pending_payment",
        payment_status="pending",
        fulfillment_status="unfulfilled",
        currency_code="VND",
        subtotal_amount=Decimal("100000.00"),
        discount_amount=Decimal("0.00"),
        shipping_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        grand_total_amount=Decimal("100000.00"),
    )
    session.add(order)
    session.commit()
    return order
