from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CouponCreateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    discount_type: str = Field(min_length=1, max_length=50)
    discount_value: Decimal
    min_order_value: Decimal | None = None
    max_discount_value: Decimal | None = None
    usage_limit_total: int | None = None
    usage_limit_per_user: int | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("discount_type")
    @classmethod
    def normalize_discount_type(cls, value: str) -> str:
        return value.strip().lower()


class CouponResponse(BaseModel):
    id: UUID
    code: str
    name: str
    discount_type: str
    discount_value: Decimal
    min_order_value: Decimal | None
    max_discount_value: Decimal | None
    usage_limit_total: int | None
    usage_limit_per_user: int | None
    starts_at: datetime | None
    ends_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CouponValidationResult(BaseModel):
    coupon: CouponResponse
    discount_amount: Decimal
