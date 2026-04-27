from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BrandCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    logo_media_id: UUID | None = None
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class BrandUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    logo_media_id: UUID | None = None
    is_active: bool | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class BrandResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    logo_media_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryCreateRequest(BaseModel):
    parent_id: UUID | None = None
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    sort_order: int = 0
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class CategoryUpdateRequest(BaseModel):
    parent_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class CategoryResponse(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    description: str | None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicBrandResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    logo_media_id: UUID | None

    model_config = {"from_attributes": True}


class PublicCategoryListItem(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    description: str | None
    sort_order: int

    model_config = {"from_attributes": True}


class PublicCategoryBreadcrumb(BaseModel):
    label: str
    path: str


class PublicCategoryDetail(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    description: str | None
    sort_order: int
    children: list[PublicCategoryListItem]
    breadcrumbs: list[PublicCategoryBreadcrumb]


class ProductCreateRequest(BaseModel):
    brand_id: UUID | None = None
    category_ids: list[UUID] = Field(default_factory=list)
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    short_description: str | None = None
    description: str | None = None
    product_type: str = Field(default="simple", min_length=1, max_length=50)
    is_featured: bool = False
    currency_code: str = Field(default="VND", min_length=3, max_length=3)
    min_price: Decimal | None = None
    max_price: Decimal | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class ProductUpdateRequest(BaseModel):
    brand_id: UUID | None = None
    category_ids: list[UUID] | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    short_description: str | None = None
    description: str | None = None
    product_type: str | None = Field(default=None, min_length=1, max_length=50)
    is_featured: bool | None = None
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    min_price: Decimal | None = None
    max_price: Decimal | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None


class ProductResponse(BaseModel):
    id: UUID
    brand_id: UUID | None
    name: str
    slug: str
    sku: str | None
    short_description: str | None
    description: str | None
    status: str
    product_type: str
    default_variant_id: UUID | None
    is_featured: bool
    currency_code: str
    min_price: Decimal | None
    max_price: Decimal | None
    published_at: datetime | None
    created_by: UUID | None
    updated_by: UUID | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}


class PublicProductListItem(BaseModel):
    id: UUID
    brand_id: UUID | None
    name: str
    slug: str
    short_description: str | None
    is_featured: bool
    currency_code: str
    min_price: Decimal | None
    max_price: Decimal | None
    published_at: datetime | None

    model_config = {"from_attributes": True}


class PublicProductBrand(BaseModel):
    id: UUID
    name: str
    slug: str


class PublicProductCategory(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str


class PublicProductImage(BaseModel):
    id: UUID
    media_id: UUID
    variant_id: UUID | None
    filename: str
    mime_type: str
    width: int | None
    height: int | None
    alt_text: str | None
    sort_order: int
    is_primary: bool


class PublicProductVariantAttributeValue(BaseModel):
    attribute_id: UUID
    attribute_code: str
    attribute_name: str
    value_id: UUID
    value_code: str
    display_value: str


class PublicProductVariant(BaseModel):
    id: UUID
    sku: str
    price: Decimal
    compare_at_price: Decimal | None
    weight_grams: int | None
    image_media_id: UUID | None
    attributes: list[PublicProductVariantAttributeValue]


class PublicProductAttributeValue(BaseModel):
    id: UUID
    value_code: str
    display_value: str
    sort_order: int


class PublicProductAttribute(BaseModel):
    id: UUID
    code: str
    name: str
    input_type: str
    is_filterable: bool
    is_variant_axis: bool
    values: list[PublicProductAttributeValue]


class PublicProductBreadcrumb(BaseModel):
    label: str
    path: str


class PublicProductSeo(BaseModel):
    title: str
    description: str | None
    canonical_path: str


class PublicProductDetail(BaseModel):
    id: UUID
    brand: PublicProductBrand | None
    categories: list[PublicProductCategory]
    name: str
    slug: str
    sku: str | None
    short_description: str | None
    description: str | None
    product_type: str
    default_variant_id: UUID | None
    is_featured: bool
    currency_code: str
    min_price: Decimal | None
    max_price: Decimal | None
    published_at: datetime
    images: list[PublicProductImage]
    variants: list[PublicProductVariant]
    attributes: list[PublicProductAttribute]
    breadcrumbs: list[PublicProductBreadcrumb]
    seo: PublicProductSeo


class ProductVariantCreateRequest(BaseModel):
    product_id: UUID
    sku: str = Field(min_length=1, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    price: Decimal
    compare_at_price: Decimal | None = None
    cost_price: Decimal | None = None
    weight_grams: int | None = None
    status: str = Field(default="active", min_length=1, max_length=50)
    image_media_id: UUID | None = None


class ProductVariantUpdateRequest(BaseModel):
    product_id: UUID | None = None
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    price: Decimal | None = None
    compare_at_price: Decimal | None = None
    cost_price: Decimal | None = None
    weight_grams: int | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)
    image_media_id: UUID | None = None


class ProductVariantResponse(BaseModel):
    id: UUID
    product_id: UUID
    sku: str
    barcode: str | None
    price: Decimal
    compare_at_price: Decimal | None
    cost_price: Decimal | None
    weight_grams: int | None
    status: str
    image_media_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
