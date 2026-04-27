from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.identity import Permission, RolePermission, UserRole


class RbacRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def user_has_permission(self, user_id: UUID, permission_code: str) -> bool:
        permission_id = self.session.scalar(
            select(Permission.id)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(UserRole, UserRole.role_id == RolePermission.role_id)
            .where(UserRole.user_id == user_id, Permission.code == permission_code)
            .limit(1)
        )
        return permission_id is not None
