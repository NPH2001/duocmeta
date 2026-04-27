from sqlalchemy import JSON, Numeric

from app.models.base import Base
from app.models.commerce import Order, Payment, PaymentEvent


def test_payment_tables_are_registered_on_metadata() -> None:
    assert {"payments", "payment_events"}.issubset(Base.metadata.tables)


def test_payment_model_tracks_provider_status_and_payload() -> None:
    payments_table = Payment.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in payments_table.foreign_keys}
    index_names = {index.name for index in payments_table.indexes}

    assert payments_table.c.order_id.nullable is False
    assert payments_table.c.provider_code.nullable is False
    assert payments_table.c.method_code.nullable is False
    assert payments_table.c.status.nullable is False
    assert payments_table.c.amount.nullable is False
    assert isinstance(payments_table.c.amount.type, Numeric)
    assert payments_table.c.amount.type.precision == 18
    assert payments_table.c.amount.type.scale == 2
    assert payments_table.c.transaction_reference.nullable is True
    assert isinstance(payments_table.c.provider_payload.type, JSON)
    assert payments_table.c.provider_payload.nullable is True
    assert payments_table.c.paid_at.nullable is True
    assert payments_table.c.failed_at.nullable is True
    assert payments_table.c.created_at.nullable is False
    assert payments_table.c.updated_at.nullable is False
    assert str(foreign_keys["order_id"].column) == "orders.id"
    assert foreign_keys["order_id"].ondelete == "CASCADE"
    assert "ix_payments_order_id" in index_names
    assert "ix_payments_provider_code" in index_names
    assert "ix_payments_status" in index_names
    assert "ix_payments_transaction_reference" in index_names


def test_payment_event_model_tracks_webhook_payloads() -> None:
    events_table = PaymentEvent.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in events_table.foreign_keys}
    index_names = {index.name for index in events_table.indexes}

    assert events_table.c.payment_id.nullable is False
    assert events_table.c.event_type.nullable is False
    assert events_table.c.provider_event_id.nullable is True
    assert isinstance(events_table.c.payload.type, JSON)
    assert events_table.c.payload.nullable is False
    assert events_table.c.created_at.nullable is False
    assert str(foreign_keys["payment_id"].column) == "payments.id"
    assert foreign_keys["payment_id"].ondelete == "CASCADE"
    assert "ix_payment_events_payment_id" in index_names
    assert "ix_payment_events_event_type" in index_names
    assert "ix_payment_events_provider_event_id" in index_names
    assert "ix_payment_events_created_at" in index_names


def test_payment_relationships_are_wired() -> None:
    assert Order.payment.property.back_populates == "order"
    assert Payment.order.property.back_populates == "payment"
    assert Payment.events.property.back_populates == "payment"
    assert PaymentEvent.payment.property.back_populates == "events"
