from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from http import HTTPStatus
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.identity import User
from app.repositories.auth import AuthRepository
from app.schemas.auth import AuthTokenPayload, LoginRequest, RegisterRequest, UserProfile


class AuthServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class AuthResult:
    payload: AuthTokenPayload
    refresh_token: str
    refresh_token_expires_at: datetime


class AuthService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.repository = AuthRepository(session)

    def register(self, request: RegisterRequest) -> AuthResult:
        existing_user = self.repository.get_user_by_email(request.email)

        if existing_user is not None:
            raise AuthServiceError("EMAIL_ALREADY_REGISTERED", "Email is already registered.", HTTPStatus.CONFLICT)

        user = self.repository.create_user(
            email=request.email,
            password_hash=hash_password(request.password),
            full_name=request.full_name,
            phone=request.phone,
        )
        customer_role = self.repository.get_role_by_code("customer")

        if customer_role is not None:
            self.repository.assign_role(user.id, customer_role.id)

        result = self._issue_auth_result(user)
        self.session.commit()
        return result

    def login(self, request: LoginRequest) -> AuthResult:
        user = self.repository.get_user_by_email(request.email)

        if user is None or not verify_password(request.password, user.password_hash):
            raise AuthServiceError("INVALID_CREDENTIALS", "Invalid email or password.", HTTPStatus.UNAUTHORIZED)

        if user.status != "active":
            raise AuthServiceError("USER_INACTIVE", "User account is not active.", HTTPStatus.FORBIDDEN)

        user.last_login_at = datetime.now(UTC)
        result = self._issue_auth_result(user)
        self.session.commit()
        return result

    def refresh(self, refresh_token: str | None) -> AuthResult:
        if not refresh_token:
            raise AuthServiceError("REFRESH_TOKEN_REQUIRED", "Refresh token is required.", HTTPStatus.UNAUTHORIZED)

        now = datetime.now(UTC)
        token_hash = hash_refresh_token(refresh_token, self.settings.secret_key)
        persisted_token = self.repository.get_active_refresh_token(token_hash, now)

        if persisted_token is None:
            raise AuthServiceError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.", HTTPStatus.UNAUTHORIZED)

        user = self.repository.get_user_by_id(persisted_token.user_id)

        if user is None or user.deleted_at is not None:
            raise AuthServiceError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.", HTTPStatus.UNAUTHORIZED)

        if user.status != "active":
            raise AuthServiceError("USER_INACTIVE", "User account is not active.", HTTPStatus.FORBIDDEN)

        self.repository.revoke_refresh_token(persisted_token, now)
        result = self._issue_auth_result(user, now=now)
        self.session.commit()
        return result

    def get_current_user(self, access_token: str | None) -> User:
        if not access_token:
            raise AuthServiceError("ACCESS_TOKEN_REQUIRED", "Access token is required.", HTTPStatus.UNAUTHORIZED)

        payload = decode_access_token(access_token, self.settings.secret_key)

        if payload is None:
            raise AuthServiceError("INVALID_ACCESS_TOKEN", "Access token is invalid or expired.", HTTPStatus.UNAUTHORIZED)

        try:
            user_id = UUID(str(payload["sub"]))
        except (KeyError, ValueError):
            raise AuthServiceError("INVALID_ACCESS_TOKEN", "Access token is invalid or expired.", HTTPStatus.UNAUTHORIZED) from None

        user = self.repository.get_user_by_id(user_id)

        if user is None or user.deleted_at is not None:
            raise AuthServiceError("INVALID_ACCESS_TOKEN", "Access token is invalid or expired.", HTTPStatus.UNAUTHORIZED)

        if user.status != "active":
            raise AuthServiceError("USER_INACTIVE", "User account is not active.", HTTPStatus.FORBIDDEN)

        return user

    def _issue_auth_result(self, user: User, now: datetime | None = None) -> AuthResult:
        issued_at = now or datetime.now(UTC)
        refresh_token = generate_refresh_token()
        refresh_token_expires_at = issued_at + timedelta(days=self.settings.refresh_token_ttl_days)
        access_token = create_access_token(
            subject=str(user.id),
            secret_key=self.settings.secret_key,
            expires_delta=timedelta(minutes=self.settings.access_token_ttl_minutes),
            now=issued_at,
        )
        self.repository.create_refresh_token(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token, self.settings.secret_key),
            expires_at=refresh_token_expires_at,
        )

        return AuthResult(
            payload=AuthTokenPayload(access_token=access_token, user=_to_user_profile(user)),
            refresh_token=refresh_token,
            refresh_token_expires_at=refresh_token_expires_at,
        )


def _to_user_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        status=user.status,
        email_verified_at=user.email_verified_at,
    )
