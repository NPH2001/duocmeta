from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CartItemCreateRequest(BaseModel):
    variant_id: UUID
    quantity: int


class CartItemUpdateRequest(BaseModel):
    quantity: int


class CartItemProductResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    currency_code: str


class CartItemVariantResponse(BaseModel):
    id: UUID
    sku: str
    price: Decimal


class CartItemResponse(BaseModel):
    id: UUID
    quantity: int
    product: CartItemProductResponse
    variant: CartItemVariantResponse


class CartResponse(BaseModel):
    id: UUID
    status: str
    items: list[CartItemResponse]


class PlaceOrderRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    notes: str | None = None


class CheckoutShippingAddress(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    province: str | None = None
    district: str | None = None
    ward: str | None = None
    address_line1: str | None = None


class CheckoutPreviewRequest(BaseModel):
    shipping_address: CheckoutShippingAddress | None = None
    shipping_method: str | None = None
    payment_method: str | None = None
    coupon_code: str | None = None


class CheckoutPreviewItemResponse(BaseModel):
    cart_item_id: UUID
    product_id: UUID
    variant_id: UUID
    product_name: str
    sku: str
    quantity: int
    unit_price: Decimal
    line_total_amount: Decimal


class CheckoutPreviewResponse(BaseModel):
    currency_code: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    coupon_code: str | None
    validation_warnings: list[str]
    items: list[CheckoutPreviewItemResponse]


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: UUID
    product_name: str
    variant_name: str | None
    sku: str
    unit_price: Decimal
    quantity: int
    line_total_amount: Decimal


class OrderResponse(BaseModel):
    id: UUID
    order_code: str
    status: str
    payment_status: str
    fulfillment_status: str
    currency_code: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    grand_total_amount: Decimal
    items: list[OrderItemResponse]


class CustomerOrderListItemResponse(BaseModel):
    id: UUID
    order_code: str
    status: str
    payment_status: str
    fulfillment_status: str
    currency_code: str
    grand_total_amount: Decimal
    placed_at: datetime | None
    created_at: datetime


class CustomerOrderDetailResponse(OrderResponse):
    placed_at: datetime | None
    cancelled_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
