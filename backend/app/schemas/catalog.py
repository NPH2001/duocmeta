from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, field_validator

from app.schemas.media import MediaResponse


class AdminCategoryClassification(BaseModel):
    group_code: str
    group_label: str
    allowed_product_types: list[str]
    medicine_suggestions: list[str]
    guidance: str


class AdminProductCategorySummary(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    is_active: bool

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[prop-decorator]
    @property
    def classification(self) -> AdminCategoryClassification:
        return build_admin_category_classification(self.slug, self.name)


class AdminProductCategoryAssignment(BaseModel):
    category_id: UUID
    is_primary: bool
    category: AdminProductCategorySummary

    model_config = {"from_attributes": True}


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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def classification(self) -> AdminCategoryClassification:
        return build_admin_category_classification(self.slug, self.name)


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
    primary_image_media_id: UUID | None = None
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
    primary_image_media_id: UUID | None = None
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
    categories: list[AdminProductCategoryAssignment] = Field(default_factory=list)
    images: list["AdminProductImageResponse"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}


class AdminProductImageResponse(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: UUID | None
    media_id: UUID
    sort_order: int
    is_primary: bool
    media: MediaResponse

    model_config = {"from_attributes": True}


_CATEGORY_CLASSIFICATION_RULES: tuple[dict[str, object], ...] = (
    {
        "keywords": ("lupus", "sle", "immunology", "hydroxychloroquine", "belimumab", "mycophenolate", "prednisone"),
        "group_code": "lupus-treatment",
        "group_label": "Thuốc điều trị Lupus",
        "allowed_product_types": ["prescription_reference", "prescription_medicine"],
        "medicine_suggestions": [
            "Hydroxychloroquine",
            "Belimumab",
            "Mycophenolate mofetil",
            "Prednisone",
            "Thuốc điều trị Lupus theo toa",
        ],
        "guidance": "Chỉ nên thêm thuốc điều trị Lupus hoặc mục tham chiếu kê đơn cần bác sĩ/dược sĩ chuyên môn xác nhận.",
    },
    {
        "keywords": ("oncology", "cancer", "ung-thu", "prescription", "rx", "specialist", "drug-class", "keytruda"),
        "group_code": "oncology-treatment",
        "group_label": "Thuốc điều trị ung thư",
        "allowed_product_types": ["prescription_reference", "prescription_medicine", "drug_class_reference"],
        "medicine_suggestions": [
            "Keytruda (pembrolizumab)",
            "Nitrosoureas",
            "Anthracyclines",
            "Topoisomerase inhibitors",
            "Thuốc điều trị ung thư theo toa",
        ],
        "guidance": "Chỉ nên thêm thuốc điều trị ung thư, thuốc chuyên khoa hoặc mục tham chiếu ung thư học vào nhóm này.",
    },
)

_DEFAULT_CATEGORY_CLASSIFICATION = AdminCategoryClassification(
    group_code="specialty-treatment",
    group_label="Danh mục điều trị chuyên khoa",
    allowed_product_types=["prescription_reference", "prescription_medicine", "drug_class_reference"],
    medicine_suggestions=[
        "Hydroxychloroquine",
        "Belimumab",
        "Keytruda (pembrolizumab)",
        "Nitrosoureas",
        "Thuốc điều trị chuyên khoa theo toa",
    ],
    guidance="Ưu tiên rà lại category để quy về Thuốc điều trị Lupus hoặc Thuốc điều trị ung thư trước khi lưu sản phẩm.",
)


def build_admin_category_classification(slug: str, name: str) -> AdminCategoryClassification:
    haystack = f"{slug} {name}".strip().lower()

    for rule in _CATEGORY_CLASSIFICATION_RULES:
        keywords = rule["keywords"]
        if any(keyword in haystack for keyword in keywords):
            return AdminCategoryClassification(
                group_code=rule["group_code"],
                group_label=rule["group_label"],
                allowed_product_types=list(rule["allowed_product_types"]),
                medicine_suggestions=list(rule["medicine_suggestions"]),
                guidance=rule["guidance"],
            )

    return _DEFAULT_CATEGORY_CLASSIFICATION.model_copy(deep=True)


class PublicProductListImage(BaseModel):
    id: UUID
    filename: str
    width: int | None
    height: int | None
    alt_text: str | None
    storage_key: str


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
    primary_image: PublicProductListImage | None = None

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
    storage_key: str
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
