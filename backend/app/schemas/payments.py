from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class PaymentInitiateRequest(BaseModel):
    provider_code: str = "mock"
    method_code: str = "mock_card"
    return_url: str | None = None
    cancel_url: str | None = None


class PaymentInitiateResponse(BaseModel):
    id: UUID
    order_code: str
    provider_code: str
    method_code: str
    status: str
    amount: Decimal
    transaction_reference: str | None
    action_url: str | None
    provider_payload: dict[str, object]


class PaymentWebhookResponse(BaseModel):
    provider_code: str
    provider_event_id: str
    event_type: str
    payment_status: str
    order_code: str
    order_status: str
    processed: bool
