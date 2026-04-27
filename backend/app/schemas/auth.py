from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=50)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()

        if "@" not in normalized:
            raise ValueError("Invalid email address.")

        return normalized


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: str | None
    status: str
    email_verified_at: datetime | None


class AuthTokenPayload(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
