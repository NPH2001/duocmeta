from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.identity import AuditLog, User
from app.repositories.audit import AuditRepository


@dataclass(frozen=True)
class AuditContext:
    actor: User | None
    ip_address: str | None = None
    user_agent: str | None = None


@dataclass(frozen=True)
class PaginatedResult:
    rows: list[AuditLog]
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        if self.total == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


class AuditService:
    def __init__(self, session: Session) -> None:
        self.repository = AuditRepository(session)

    def record(
        self,
        *,
        context: AuditContext,
        action_code: str,
        entity_type: str,
        entity_id: UUID | None,
        old_data: dict | None = None,
        new_data: dict | None = None,
    ) -> AuditLog:
        return self.repository.add(
            AuditLog(
                actor_user_id=context.actor.id if context.actor is not None else None,
                action_code=action_code,
                entity_type=entity_type,
                entity_id=entity_id,
                old_data=_json_ready(old_data),
                new_data=_json_ready(new_data),
                ip_address=context.ip_address,
                user_agent=context.user_agent,
            )
        )

    def list_logs(
        self,
        *,
        page: int,
        page_size: int,
        actor_user_id: UUID | None = None,
        action_code: str | None = None,
        entity_type: str | None = None,
    ) -> PaginatedResult:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        rows, total = self.repository.list_logs(
            offset=(page - 1) * page_size,
            limit=page_size,
            actor_user_id=actor_user_id,
            action_code=action_code,
            entity_type=entity_type,
        )
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)


def _json_ready(value):
    if isinstance(value, dict):
        return {key: _json_ready(item) for key, item in value.items()}

    if isinstance(value, list):
        return [_json_ready(item) for item in value]

    if isinstance(value, UUID | Decimal | datetime | date):
        return str(value)

    return value
