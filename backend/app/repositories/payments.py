from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.commerce import Order, Payment, PaymentEvent


class PaymentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_order_by_code(self, order_code: str) -> Order | None:
        statement = select(Order).where(Order.order_code == order_code).options(selectinload(Order.payment))
        return self.session.scalar(statement)

    def get_payment_by_order_id(self, order_id: UUID) -> Payment | None:
        return self.session.scalar(select(Payment).where(Payment.order_id == order_id))

    def get_payment_by_provider_reference(self, provider_code: str, transaction_reference: str) -> Payment | None:
        statement = (
            select(Payment)
            .where(
                Payment.provider_code == provider_code,
                Payment.transaction_reference == transaction_reference,
            )
            .options(selectinload(Payment.order))
        )
        return self.session.scalar(statement)

    def get_payment_event_by_provider_event_id(
        self,
        provider_event_id: str,
        provider_code: str,
    ) -> PaymentEvent | None:
        statement = (
            select(PaymentEvent)
            .join(Payment)
            .where(
                PaymentEvent.provider_event_id == provider_event_id,
                Payment.provider_code == provider_code,
            )
            .options(selectinload(PaymentEvent.payment).selectinload(Payment.order))
        )
        return self.session.scalar(statement)

    def add_payment(self, payment: Payment) -> Payment:
        self.session.add(payment)
        self.session.flush()
        return payment

    def add_payment_event(self, payment_event: PaymentEvent) -> PaymentEvent:
        self.session.add(payment_event)
        self.session.flush()
        return payment_event
