from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from http import HTTPStatus
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.catalog import Brand, Category, Product, ProductVariant
from app.models.identity import User
from app.repositories.catalog import CatalogRepository
from app.schemas.catalog import (
    BrandCreateRequest,
    BrandUpdateRequest,
    CategoryCreateRequest,
    CategoryUpdateRequest,
    PublicCategoryBreadcrumb,
    PublicCategoryDetail,
    PublicCategoryListItem,
    PublicProductAttribute,
    PublicProductAttributeValue,
    PublicProductBrand,
    PublicProductBreadcrumb,
    PublicProductCategory,
    PublicProductDetail,
    PublicProductImage,
    PublicProductSeo,
    PublicProductVariant,
    PublicProductVariantAttributeValue,
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantUpdateRequest,
)


class CatalogServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class PaginatedResult:
    rows: list
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        if self.total == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


class CatalogService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CatalogRepository(session)

    def list_brands(self, *, page: int, page_size: int) -> PaginatedResult:
        rows, total = self.repository.list_brands(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def list_public_brands(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_public_brands(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def get_public_brand(self, slug: str) -> Brand:
        brand = self.repository.get_public_brand_by_slug(slug)
        if brand is None:
            raise _not_found("BRAND_NOT_FOUND", "Brand was not found.")
        return brand

    def create_brand(self, request: BrandCreateRequest) -> Brand:
        self._ensure_brand_slug_available(request.slug)
        brand = self.repository.add_brand(
            Brand(
                name=request.name,
                slug=request.slug,
                description=request.description,
                logo_media_id=request.logo_media_id,
                is_active=request.is_active,
            )
        )
        self.session.commit()
        return brand

    def get_brand(self, brand_id: UUID) -> Brand:
        brand = self.repository.get_brand(brand_id)
        if brand is None:
            raise _not_found("BRAND_NOT_FOUND", "Brand was not found.")
        return brand

    def update_brand(self, brand_id: UUID, request: BrandUpdateRequest) -> Brand:
        brand = self.get_brand(brand_id)
        update_data = request.model_dump(exclude_unset=True)

        if "slug" in update_data and update_data["slug"] != brand.slug:
            self._ensure_brand_slug_available(update_data["slug"], exclude_id=brand.id)

        for field, value in update_data.items():
            setattr(brand, field, value)

        self.session.commit()
        return brand

    def delete_brand(self, brand_id: UUID) -> None:
        brand = self.get_brand(brand_id)
        self.repository.delete_brand(brand)
        self.session.commit()

    def list_categories(self, *, page: int, page_size: int) -> PaginatedResult:
        rows, total = self.repository.list_categories(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def list_public_categories(self, *, page: int, page_size: int) -> PaginatedResult:
        _validate_pagination(page=page, page_size=page_size)
        rows, total = self.repository.list_public_categories(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def get_public_category(self, slug: str) -> PublicCategoryDetail:
        category = self.repository.get_public_category_by_slug(slug)
        if category is None:
            raise _not_found("CATEGORY_NOT_FOUND", "Category was not found.")

        children = sorted(
            [child for child in category.children if child.is_active],
            key=lambda child: (child.sort_order, child.name),
        )
        return PublicCategoryDetail(
            id=category.id,
            parent_id=category.parent_id,
            name=category.name,
            slug=category.slug,
            description=category.description,
            sort_order=category.sort_order,
            children=[PublicCategoryListItem.model_validate(child) for child in children],
            breadcrumbs=_category_breadcrumbs(category),
        )

    def create_category(self, request: CategoryCreateRequest) -> Category:
        self._ensure_category_slug_available(request.slug)
        self._ensure_parent_category_exists(request.parent_id)
        category = self.repository.add_category(
            Category(
                parent_id=request.parent_id,
                name=request.name,
                slug=request.slug,
                description=request.description,
                sort_order=request.sort_order,
                is_active=request.is_active,
            )
        )
        self.session.commit()
        return category

    def get_category(self, category_id: UUID) -> Category:
        category = self.repository.get_category(category_id)
        if category is None:
            raise _not_found("CATEGORY_NOT_FOUND", "Category was not found.")
        return category

    def update_category(self, category_id: UUID, request: CategoryUpdateRequest) -> Category:
        category = self.get_category(category_id)
        update_data = request.model_dump(exclude_unset=True)

        if "slug" in update_data and update_data["slug"] != category.slug:
            self._ensure_category_slug_available(update_data["slug"], exclude_id=category.id)

        if "parent_id" in update_data:
            if update_data["parent_id"] == category.id:
                raise _conflict("CATEGORY_PARENT_SELF", "Category cannot be its own parent.")
            self._ensure_parent_category_exists(update_data["parent_id"])

        for field, value in update_data.items():
            setattr(category, field, value)

        self.session.commit()
        return category

    def delete_category(self, category_id: UUID) -> None:
        category = self.get_category(category_id)
        self.repository.delete_category(category)
        self.session.commit()

    def list_products(self, *, page: int, page_size: int) -> PaginatedResult:
        rows, total = self.repository.list_products(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def list_public_products(
        self,
        *,
        page: int,
        page_size: int,
        q: str | None = None,
        category_slug: str | None = None,
        brand_slug: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        sort: str = "newest",
    ) -> PaginatedResult:
        if page < 1:
            raise CatalogServiceError("INVALID_PAGE", "Page must be greater than or equal to 1.", HTTPStatus.BAD_REQUEST)

        if page_size < 1 or page_size > 100:
            raise CatalogServiceError("INVALID_PAGE_SIZE", "Page size must be between 1 and 100.", HTTPStatus.BAD_REQUEST)

        if min_price is not None and max_price is not None and min_price > max_price:
            raise CatalogServiceError("INVALID_PRICE_RANGE", "Minimum price cannot exceed maximum price.", HTTPStatus.BAD_REQUEST)

        if sort not in {"newest", "oldest", "price_asc", "price_desc", "name_asc"}:
            raise CatalogServiceError("INVALID_SORT", "Sort option is not supported.", HTTPStatus.BAD_REQUEST)

        rows, total = self.repository.list_public_products(
            offset=_offset(page, page_size),
            limit=page_size,
            q=q,
            category_slug=category_slug,
            brand_slug=brand_slug,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
        )
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def get_public_product_detail(self, slug: str) -> PublicProductDetail:
        product = self.repository.get_public_product_detail_by_slug(slug)
        if product is None:
            raise _not_found("PRODUCT_NOT_FOUND", "Product was not found.")

        categories = _active_categories(product)
        variants = sorted(
            [variant for variant in product.variants if variant.status == "active"],
            key=lambda variant: variant.created_at,
        )
        active_variant_ids = {variant.id for variant in variants}
        default_variant_id = product.default_variant_id if product.default_variant_id in active_variant_ids else None

        return PublicProductDetail(
            id=product.id,
            brand=_public_brand(product.brand),
            categories=[_public_category(product_category.category) for product_category in categories],
            name=product.name,
            slug=product.slug,
            sku=product.sku,
            short_description=product.short_description,
            description=product.description,
            product_type=product.product_type,
            default_variant_id=default_variant_id,
            is_featured=product.is_featured,
            currency_code=product.currency_code,
            min_price=product.min_price,
            max_price=product.max_price,
            published_at=product.published_at,
            images=_public_images(product, active_variant_ids),
            variants=[_public_variant(variant) for variant in variants],
            attributes=_public_attributes(variants),
            breadcrumbs=_public_breadcrumbs(product, categories),
            seo=PublicProductSeo(
                title=product.name,
                description=product.short_description,
                canonical_path=f"/products/{product.slug}",
            ),
        )

    def create_product(self, request: ProductCreateRequest, actor: User) -> Product:
        self._ensure_product_slug_available(request.slug)
        self._ensure_product_sku_available(request.sku)
        self._ensure_brand_exists(request.brand_id)
        self._ensure_categories_exist(request.category_ids)
        product = self.repository.add_product(
            Product(
                brand_id=request.brand_id,
                name=request.name,
                slug=request.slug,
                sku=request.sku,
                short_description=request.short_description,
                description=request.description,
                product_type=request.product_type,
                is_featured=request.is_featured,
                currency_code=request.currency_code,
                min_price=request.min_price,
                max_price=request.max_price,
                created_by=actor.id,
                updated_by=actor.id,
            )
        )
        self.repository.set_product_categories(product, request.category_ids)
        self.session.commit()
        return product

    def get_product(self, product_id: UUID) -> Product:
        product = self.repository.get_product(product_id)
        if product is None:
            raise _not_found("PRODUCT_NOT_FOUND", "Product was not found.")
        return product

    def update_product(self, product_id: UUID, request: ProductUpdateRequest, actor: User) -> Product:
        product = self.get_product(product_id)
        update_data = request.model_dump(exclude_unset=True)
        category_ids = update_data.pop("category_ids", None)

        if "slug" in update_data and update_data["slug"] != product.slug:
            self._ensure_product_slug_available(update_data["slug"], exclude_id=product.id)

        if "sku" in update_data and update_data["sku"] != product.sku:
            self._ensure_product_sku_available(update_data["sku"], exclude_id=product.id)

        if "brand_id" in update_data:
            self._ensure_brand_exists(update_data["brand_id"])

        for field, value in update_data.items():
            setattr(product, field, value)

        if category_ids is not None:
            self._ensure_categories_exist(category_ids)
            self.repository.set_product_categories(product, category_ids)

        product.updated_by = actor.id
        self.session.commit()
        return product

    def publish_product(self, product_id: UUID, actor: User) -> Product:
        product = self.get_product(product_id)
        product.status = "active"
        product.published_at = product.published_at or datetime.now(UTC)
        product.updated_by = actor.id
        self.session.commit()
        return product

    def archive_product(self, product_id: UUID, actor: User) -> Product:
        product = self.get_product(product_id)
        product.status = "archived"
        product.updated_by = actor.id
        self.session.commit()
        return product

    def list_variants(self, *, page: int, page_size: int) -> PaginatedResult:
        rows, total = self.repository.list_variants(offset=_offset(page, page_size), limit=page_size)
        return PaginatedResult(rows=rows, total=total, page=page, page_size=page_size)

    def create_variant(self, request: ProductVariantCreateRequest) -> ProductVariant:
        self.get_product(request.product_id)
        self._ensure_variant_sku_available(request.sku)
        variant = self.repository.add_variant(ProductVariant(**request.model_dump()))
        self.session.commit()
        return variant

    def get_variant(self, variant_id: UUID) -> ProductVariant:
        variant = self.repository.get_variant(variant_id)
        if variant is None:
            raise _not_found("VARIANT_NOT_FOUND", "Product variant was not found.")
        return variant

    def update_variant(self, variant_id: UUID, request: ProductVariantUpdateRequest) -> ProductVariant:
        variant = self.get_variant(variant_id)
        update_data = request.model_dump(exclude_unset=True)

        if "product_id" in update_data:
            self.get_product(update_data["product_id"])

        if "sku" in update_data and update_data["sku"] != variant.sku:
            self._ensure_variant_sku_available(update_data["sku"], exclude_id=variant.id)

        for field, value in update_data.items():
            setattr(variant, field, value)

        self.session.commit()
        return variant

    def delete_variant(self, variant_id: UUID) -> None:
        variant = self.get_variant(variant_id)
        self.repository.delete_variant(variant)
        self.session.commit()

    def _ensure_brand_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_brand_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("BRAND_SLUG_EXISTS", "Brand slug already exists.")

    def _ensure_category_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_category_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("CATEGORY_SLUG_EXISTS", "Category slug already exists.")

    def _ensure_product_slug_available(self, slug: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_product_by_slug(slug)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("PRODUCT_SLUG_EXISTS", "Product slug already exists.")

    def _ensure_product_sku_available(self, sku: str | None, exclude_id: UUID | None = None) -> None:
        if sku is None:
            return

        existing = self.repository.get_product_by_sku(sku)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("PRODUCT_SKU_EXISTS", "Product SKU already exists.")

    def _ensure_variant_sku_available(self, sku: str, exclude_id: UUID | None = None) -> None:
        existing = self.repository.get_variant_by_sku(sku)
        if existing is not None and existing.id != exclude_id:
            raise _conflict("VARIANT_SKU_EXISTS", "Variant SKU already exists.")

    def _ensure_brand_exists(self, brand_id: UUID | None) -> None:
        if brand_id is not None and self.repository.get_brand(brand_id) is None:
            raise _not_found("BRAND_NOT_FOUND", "Brand was not found.")

    def _ensure_parent_category_exists(self, parent_id: UUID | None) -> None:
        if parent_id is not None and self.repository.get_category(parent_id) is None:
            raise _not_found("CATEGORY_PARENT_NOT_FOUND", "Parent category was not found.")

    def _ensure_categories_exist(self, category_ids: list[UUID]) -> None:
        for category_id in category_ids:
            if self.repository.get_category(category_id) is None:
                raise _not_found("CATEGORY_NOT_FOUND", "Category was not found.")


def _offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


def _validate_pagination(*, page: int, page_size: int) -> None:
    if page < 1:
        raise CatalogServiceError("INVALID_PAGE", "Page must be greater than or equal to 1.", HTTPStatus.BAD_REQUEST)

    if page_size < 1 or page_size > 100:
        raise CatalogServiceError("INVALID_PAGE_SIZE", "Page size must be between 1 and 100.", HTTPStatus.BAD_REQUEST)


def _category_breadcrumbs(category: Category) -> list[PublicCategoryBreadcrumb]:
    breadcrumbs = [PublicCategoryBreadcrumb(label="Home", path="/")]
    ancestors = []
    current = category

    while current is not None:
        if current.is_active:
            ancestors.append(current)
        current = current.parent

    for ancestor in reversed(ancestors):
        breadcrumbs.append(PublicCategoryBreadcrumb(label=ancestor.name, path=f"/categories/{ancestor.slug}"))

    return breadcrumbs


def _active_categories(product: Product):
    categories = [product_category for product_category in product.categories if product_category.category.is_active]
    return sorted(categories, key=lambda product_category: (not product_category.is_primary, product_category.category.sort_order))


def _public_brand(brand: Brand | None) -> PublicProductBrand | None:
    if brand is None or not brand.is_active:
        return None

    return PublicProductBrand(id=brand.id, name=brand.name, slug=brand.slug)


def _public_category(category: Category) -> PublicProductCategory:
    return PublicProductCategory(
        id=category.id,
        parent_id=category.parent_id,
        name=category.name,
        slug=category.slug,
    )


def _public_images(product: Product, active_variant_ids: set[UUID]) -> list[PublicProductImage]:
    images = [
        image
        for image in product.images
        if image.variant_id is None or image.variant_id in active_variant_ids
    ]
    return [
        PublicProductImage(
            id=image.id,
            media_id=image.media_id,
            variant_id=image.variant_id,
            filename=image.media.filename,
            mime_type=image.media.mime_type,
            width=image.media.width,
            height=image.media.height,
            alt_text=image.media.alt_text,
            sort_order=image.sort_order,
            is_primary=image.is_primary,
        )
        for image in sorted(images, key=lambda image: (not image.is_primary, image.sort_order))
    ]


def _public_variant(variant: ProductVariant) -> PublicProductVariant:
    return PublicProductVariant(
        id=variant.id,
        sku=variant.sku,
        price=variant.price,
        compare_at_price=variant.compare_at_price,
        weight_grams=variant.weight_grams,
        image_media_id=variant.image_media_id,
        attributes=[
            PublicProductVariantAttributeValue(
                attribute_id=link.attribute_value.attribute.id,
                attribute_code=link.attribute_value.attribute.code,
                attribute_name=link.attribute_value.attribute.name,
                value_id=link.attribute_value.id,
                value_code=link.attribute_value.value_code,
                display_value=link.attribute_value.display_value,
            )
            for link in sorted(
                variant.attribute_values,
                key=lambda link: (
                    link.attribute_value.attribute.code,
                    link.attribute_value.sort_order,
                    link.attribute_value.display_value,
                ),
            )
        ],
    )


def _public_attributes(variants: list[ProductVariant]) -> list[PublicProductAttribute]:
    grouped: dict[UUID, dict] = {}

    for variant in variants:
        for link in variant.attribute_values:
            value = link.attribute_value
            attribute = value.attribute
            group = grouped.setdefault(
                attribute.id,
                {
                    "attribute": attribute,
                    "values": {},
                },
            )
            group["values"][value.id] = value

    attributes = []
    for group in grouped.values():
        attribute = group["attribute"]
        values = sorted(group["values"].values(), key=lambda value: (value.sort_order, value.display_value))
        attributes.append(
            PublicProductAttribute(
                id=attribute.id,
                code=attribute.code,
                name=attribute.name,
                input_type=attribute.input_type,
                is_filterable=attribute.is_filterable,
                is_variant_axis=attribute.is_variant_axis,
                values=[
                    PublicProductAttributeValue(
                        id=value.id,
                        value_code=value.value_code,
                        display_value=value.display_value,
                        sort_order=value.sort_order,
                    )
                    for value in values
                ],
            )
        )

    return sorted(attributes, key=lambda attribute: attribute.code)


def _public_breadcrumbs(product: Product, categories) -> list[PublicProductBreadcrumb]:
    breadcrumbs = [PublicProductBreadcrumb(label="Home", path="/")]
    primary_category = categories[0].category if categories else None

    if primary_category is not None:
        ancestors = []
        category = primary_category
        while category is not None:
            if category.is_active:
                ancestors.append(category)
            category = category.parent

        for category in reversed(ancestors):
            breadcrumbs.append(PublicProductBreadcrumb(label=category.name, path=f"/categories/{category.slug}"))

    breadcrumbs.append(PublicProductBreadcrumb(label=product.name, path=f"/products/{product.slug}"))
    return breadcrumbs


def _not_found(code: str, message: str) -> CatalogServiceError:
    return CatalogServiceError(code, message, HTTPStatus.NOT_FOUND)


def _conflict(code: str, message: str) -> CatalogServiceError:
    return CatalogServiceError(code, message, HTTPStatus.CONFLICT)
