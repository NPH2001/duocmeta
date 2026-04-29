from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_permission
from app.core.db import get_db_session
from app.schemas.audit import AuditLogResponse
from app.services.audit import AuditService, PaginatedResult


router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["admin-audit"],
    dependencies=[Depends(require_permission("view_audit_logs"))],
)


@router.get("")
def list_audit_logs(
    page: int = 1,
    page_size: int = 20,
    actor_user_id: UUID | None = None,
    action_code: str | None = None,
    entity_type: str | None = None,
    session: Session = Depends(get_db_session),
):
    result = AuditService(session).list_logs(
        page=page,
        page_size=page_size,
        actor_user_id=actor_user_id,
        action_code=action_code,
        entity_type=entity_type,
    )
    return _paginated_response(result)


def _paginated_response(result: PaginatedResult):
    return {
        "data": [AuditLogResponse.model_validate(row).model_dump(mode="json") for row in result.rows],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }
