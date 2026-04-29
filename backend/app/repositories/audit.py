from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.identity import AuditLog


class AuditRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, audit_log: AuditLog) -> AuditLog:
        self.session.add(audit_log)
        self.session.flush()
        return audit_log

    def list_logs(
        self,
        *,
        offset: int,
        limit: int,
        actor_user_id: UUID | None = None,
        action_code: str | None = None,
        entity_type: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        statement = select(AuditLog)
        count_statement = select(func.count(AuditLog.id))

        if actor_user_id is not None:
            statement = statement.where(AuditLog.actor_user_id == actor_user_id)
            count_statement = count_statement.where(AuditLog.actor_user_id == actor_user_id)

        if action_code is not None:
            statement = statement.where(AuditLog.action_code == action_code)
            count_statement = count_statement.where(AuditLog.action_code == action_code)

        if entity_type is not None:
            statement = statement.where(AuditLog.entity_type == entity_type)
            count_statement = count_statement.where(AuditLog.entity_type == entity_type)

        rows = self.session.scalars(
            statement.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        ).all()
        total = self.session.scalar(count_statement) or 0
        return list(rows), total
