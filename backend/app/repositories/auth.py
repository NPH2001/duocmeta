from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.identity import RefreshToken, Role, User, UserRole


class AuthRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_user_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email, User.deleted_at.is_(None)))

    def get_user_by_id(self, user_id: UUID) -> User | None:
        return self.session.get(User, user_id)

    def create_user(self, *, email: str, password_hash: str, full_name: str, phone: str | None) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name, phone=phone)
        self.session.add(user)
        self.session.flush()
        return user

    def get_role_by_code(self, code: str) -> Role | None:
        return self.session.scalar(select(Role).where(Role.code == code))

    def assign_role(self, user_id: UUID, role_id: UUID) -> None:
        exists = self.session.scalar(select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id))

        if exists is None:
            self.session.add(UserRole(user_id=user_id, role_id=role_id))

    def create_refresh_token(self, *, user_id: UUID, token_hash: str, expires_at: datetime) -> RefreshToken:
        refresh_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.session.add(refresh_token)
        self.session.flush()
        return refresh_token

    def get_active_refresh_token(self, token_hash: str, now: datetime) -> RefreshToken | None:
        return self.session.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
        )

    def revoke_refresh_token(self, refresh_token: RefreshToken, revoked_at: datetime) -> None:
        refresh_token.revoked_at = revoked_at
