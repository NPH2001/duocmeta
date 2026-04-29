from collections.abc import Generator
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.identity import User
from app.services.audit import AuditContext, AuditService


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


def test_audit_service_records_structured_log_entry(session: Session) -> None:
    actor = User(email="admin@example.com", password_hash="hash", full_name="Admin User")
    session.add(actor)
    session.commit()

    audit_log = AuditService(session).record(
        context=AuditContext(actor=actor, ip_address="127.0.0.1", user_agent="test-agent"),
        action_code="variant.update",
        entity_type="product_variant",
        entity_id=actor.id,
        old_data={"price": Decimal("10.00")},
        new_data={"price": Decimal("12.00")},
    )
    session.commit()

    assert audit_log.actor_user_id == actor.id
    assert audit_log.action_code == "variant.update"
    assert audit_log.entity_type == "product_variant"
    assert audit_log.old_data == {"price": "10.00"}
    assert audit_log.new_data == {"price": "12.00"}
    assert audit_log.ip_address == "127.0.0.1"
    assert audit_log.user_agent == "test-agent"


def test_audit_service_lists_logs_with_filters(session: Session) -> None:
    actor = User(email="admin@example.com", password_hash="hash", full_name="Admin User")
    session.add(actor)
    session.commit()

    audit_service = AuditService(session)
    audit_service.record(
        context=AuditContext(actor=actor),
        action_code="order.cancel",
        entity_type="order",
        entity_id=actor.id,
    )
    audit_service.record(
        context=AuditContext(actor=actor),
        action_code="product.publish",
        entity_type="product",
        entity_id=actor.id,
    )
    session.commit()

    result = audit_service.list_logs(page=1, page_size=20, entity_type="order")

    assert result.total == 1
    assert result.rows[0].action_code == "order.cancel"
