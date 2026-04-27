from collections.abc import Callable
from http import HTTPStatus

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.models.identity import User
from app.repositories.rbac import RbacRepository
from app.services.auth import AuthService


class AuthorizationError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> User:
    return AuthService(session, settings).get_current_user(_extract_bearer_token(authorization))


def require_permission(permission_code: str) -> Callable[[User, Session], User]:
    def dependency(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_db_session),
    ) -> User:
        has_permission = RbacRepository(session).user_has_permission(current_user.id, permission_code)

        if not has_permission:
            raise AuthorizationError(
                "PERMISSION_DENIED",
                "You do not have permission to perform this action.",
                HTTPStatus.FORBIDDEN,
            )

        return current_user

    return dependency


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return None

    return token
