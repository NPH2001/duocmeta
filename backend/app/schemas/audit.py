from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: UUID
    actor_user_id: UUID | None
    action_code: str
    entity_type: str
    entity_id: UUID | None
    old_data: dict | None
    new_data: dict | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
