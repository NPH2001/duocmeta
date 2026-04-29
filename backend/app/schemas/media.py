from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MediaPresignRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(gt=0)

    @field_validator("filename")
    @classmethod
    def normalize_filename(cls, value: str) -> str:
        return value.strip()

    @field_validator("mime_type")
    @classmethod
    def normalize_mime_type(cls, value: str) -> str:
        return value.strip().lower()


class MediaPresignResponse(BaseModel):
    storage_key: str
    bucket: str
    upload_url: str
    public_url: str
    method: str
    headers: dict[str, str]
    expires_at: datetime


class MediaCompleteRequest(BaseModel):
    storage_key: str = Field(min_length=1, max_length=500)
    filename: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(gt=0)
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)
    alt_text: str | None = Field(default=None, max_length=255)

    @field_validator("storage_key", "filename")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("mime_type")
    @classmethod
    def normalize_mime_type(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("alt_text")
    @classmethod
    def normalize_alt_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class MediaDerivativeResponse(BaseModel):
    id: UUID
    kind: str
    storage_key: str
    mime_type: str
    width: int
    height: int
    status: str
    error_message: str | None
    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MediaResponse(BaseModel):
    id: UUID
    storage_key: str
    filename: str
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    alt_text: str | None
    uploaded_by: UUID | None
    created_at: datetime
    derivatives: list[MediaDerivativeResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
