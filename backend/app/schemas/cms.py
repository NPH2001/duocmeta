from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PageCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    content: dict[str, object]
    status: str = Field(default="draft", min_length=1, max_length=50)
    published_at: datetime | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return value.strip().lower()


class PageUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    content: dict[str, object] | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)
    published_at: datetime | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class PageResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: dict[str, object]
    status: str
    published_at: datetime | None
    created_by: UUID | None
    updated_by: UUID | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}


class PostCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    summary: str | None = None
    content: dict[str, object]
    status: str = Field(default="draft", min_length=1, max_length=50)
    published_at: datetime | None = None
    tag_ids: list[UUID] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return value.strip().lower()


class PostUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    summary: str | None = None
    content: dict[str, object] | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)
    published_at: datetime | None = None
    tag_ids: list[UUID] | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class PostResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: str | None
    content: dict[str, object]
    status: str
    published_at: datetime | None
    author_id: UUID | None
    tag_ids: list[UUID] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}


class TagCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class TagUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class TagResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SeoMetadataCreateRequest(BaseModel):
    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: UUID
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)
    canonical_url: str | None = Field(default=None, max_length=500)
    robots: str | None = Field(default=None, max_length=100)
    og_title: str | None = Field(default=None, max_length=255)
    og_description: str | None = Field(default=None, max_length=500)
    og_image_media_id: UUID | None = None
    schema_json: dict[str, object] | None = None

    @field_validator("entity_type")
    @classmethod
    def normalize_entity_type(cls, value: str) -> str:
        return value.strip().lower()


class SeoMetadataUpdateRequest(BaseModel):
    entity_type: str | None = Field(default=None, min_length=1, max_length=50)
    entity_id: UUID | None = None
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)
    canonical_url: str | None = Field(default=None, max_length=500)
    robots: str | None = Field(default=None, max_length=100)
    og_title: str | None = Field(default=None, max_length=255)
    og_description: str | None = Field(default=None, max_length=500)
    og_image_media_id: UUID | None = None
    schema_json: dict[str, object] | None = None

    @field_validator("entity_type")
    @classmethod
    def normalize_entity_type(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class SeoMetadataResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    meta_title: str | None
    meta_description: str | None
    canonical_url: str | None
    robots: str | None
    og_title: str | None
    og_description: str | None
    og_image_media_id: UUID | None
    schema_json: dict[str, object] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RedirectCreateRequest(BaseModel):
    from_path: str = Field(min_length=1, max_length=500)
    to_path: str = Field(min_length=1, max_length=500)
    status_code: int = 301
    is_active: bool = True


class RedirectUpdateRequest(BaseModel):
    from_path: str | None = Field(default=None, min_length=1, max_length=500)
    to_path: str | None = Field(default=None, min_length=1, max_length=500)
    status_code: int | None = None
    is_active: bool | None = None


class RedirectResponse(BaseModel):
    id: UUID
    from_path: str
    to_path: str
    status_code: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicRedirectResponse(BaseModel):
    from_path: str
    to_path: str
    status_code: int


class PublicSeoMetadata(BaseModel):
    meta_title: str | None
    meta_description: str | None
    canonical_url: str | None
    robots: str | None
    og_title: str | None
    og_description: str | None
    og_image_media_id: UUID | None
    schema_json: dict[str, object] | None


class PublicPageDetail(BaseModel):
    id: UUID
    title: str
    slug: str
    content: dict[str, object]
    published_at: datetime
    seo: PublicSeoMetadata | None


class PublicPostListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: str | None
    published_at: datetime
    tag_ids: list[UUID] = Field(default_factory=list)
    seo: PublicSeoMetadata | None


class PublicPostDetail(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: str | None
    content: dict[str, object]
    published_at: datetime
    tag_ids: list[UUID] = Field(default_factory=list)
    seo: PublicSeoMetadata | None
