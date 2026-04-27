from sqlalchemy import MetaData

from app.models.base import Base


def test_coupon_tables_are_registered() -> None:
    metadata: MetaData = Base.metadata

    assert "coupons" in metadata.tables
    assert "coupon_usages" in metadata.tables

    coupons = metadata.tables["coupons"]
    coupon_usages = metadata.tables["coupon_usages"]

    assert coupons.c.code.nullable is False
    assert coupons.c.discount_type.nullable is False
    assert coupons.c.discount_value.nullable is False
    assert coupons.c.is_active.default is not None or coupons.c.is_active.server_default is not None
    assert coupon_usages.c.coupon_id.nullable is False
    assert coupon_usages.c.order_id.nullable is False
    assert coupon_usages.c.discount_amount.nullable is False


def test_coupon_usage_relationship_indexes_exist() -> None:
    coupon_usages = Base.metadata.tables["coupon_usages"]
    index_names = {index.name for index in coupon_usages.indexes}
    unique_constraints = {constraint.name for constraint in coupon_usages.constraints}

    assert "ix_coupon_usages_coupon_id" in index_names
    assert "ix_coupon_usages_order_id" in index_names
    assert "ix_coupon_usages_user_id" in index_names
    assert "uq_coupon_usages_coupon_id_order_id" in unique_constraints
