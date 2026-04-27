from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.catalog import (
    Brand,
    Category,
    Product,
    ProductAttributeValue,
    ProductCategory,
    ProductImage,
    ProductVariant,
    VariantAttributeValue,
)


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_brands(self, *, offset: int, limit: int) -> tuple[list[Brand], int]:
        return self._list_with_total(select(Brand).order_by(Brand.created_at.desc()), offset=offset, limit=limit)

    def list_public_brands(self, *, offset: int, limit: int) -> tuple[list[Brand], int]:
        return self._list_with_total(
            select(Brand).where(Brand.is_active.is_(True)).order_by(Brand.name.asc()),
            offset=offset,
            limit=limit,
        )

    def get_brand(self, brand_id: UUID) -> Brand | None:
        return self.session.get(Brand, brand_id)

    def get_brand_by_slug(self, slug: str) -> Brand | None:
        return self.session.scalar(select(Brand).where(Brand.slug == slug))

    def get_public_brand_by_slug(self, slug: str) -> Brand | None:
        return self.session.scalar(select(Brand).where(Brand.slug == slug, Brand.is_active.is_(True)))

    def add_brand(self, brand: Brand) -> Brand:
        self.session.add(brand)
        self.session.flush()
        return brand

    def delete_brand(self, brand: Brand) -> None:
        self.session.delete(brand)

    def list_categories(self, *, offset: int, limit: int) -> tuple[list[Category], int]:
        return self._list_with_total(
            select(Category).order_by(Category.sort_order.asc(), Category.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def list_public_categories(self, *, offset: int, limit: int) -> tuple[list[Category], int]:
        return self._list_with_total(
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.sort_order.asc(), Category.name.asc()),
            offset=offset,
            limit=limit,
        )

    def get_category(self, category_id: UUID) -> Category | None:
        return self.session.get(Category, category_id)

    def get_category_by_slug(self, slug: str) -> Category | None:
        return self.session.scalar(select(Category).where(Category.slug == slug))

    def get_public_category_by_slug(self, slug: str) -> Category | None:
        statement = (
            select(Category)
            .where(Category.slug == slug, Category.is_active.is_(True))
            .options(selectinload(Category.parent), selectinload(Category.children))
        )
        return self.session.scalar(statement)

    def add_category(self, category: Category) -> Category:
        self.session.add(category)
        self.session.flush()
        return category

    def delete_category(self, category: Category) -> None:
        self.session.delete(category)

    def list_products(self, *, offset: int, limit: int) -> tuple[list[Product], int]:
        return self._list_with_total(
            select(Product).where(Product.deleted_at.is_(None)).order_by(Product.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def list_public_products(
        self,
        *,
        offset: int,
        limit: int,
        q: str | None,
        category_slug: str | None,
        brand_slug: str | None,
        min_price: Decimal | None,
        max_price: Decimal | None,
        sort: str,
    ) -> tuple[list[Product], int]:
        statement = select(Product).where(
            Product.status == "active",
            Product.deleted_at.is_(None),
            Product.published_at.is_not(None),
        )

        if q:
            search = f"%{q.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Product.name).like(search),
                    func.lower(Product.short_description).like(search),
                )
            )

        if brand_slug:
            statement = statement.join(Brand, Brand.id == Product.brand_id).where(
                Brand.slug == brand_slug,
                Brand.is_active.is_(True),
            )

        if category_slug:
            statement = (
                statement.join(ProductCategory, ProductCategory.product_id == Product.id)
                .join(Category, Category.id == ProductCategory.category_id)
                .where(Category.slug == category_slug, Category.is_active.is_(True))
            )

        if min_price is not None:
            statement = statement.where(Product.max_price >= min_price)

        if max_price is not None:
            statement = statement.where(Product.min_price <= max_price)

        statement = statement.distinct()

        match sort:
            case "price_asc":
                statement = statement.order_by(Product.min_price.asc().nullslast(), Product.created_at.desc())
            case "price_desc":
                statement = statement.order_by(Product.max_price.desc().nullslast(), Product.created_at.desc())
            case "name_asc":
                statement = statement.order_by(Product.name.asc())
            case "oldest":
                statement = statement.order_by(Product.published_at.asc(), Product.created_at.asc())
            case _:
                statement = statement.order_by(Product.published_at.desc(), Product.created_at.desc())

        return self._list_with_total(statement, offset=offset, limit=limit)

    def get_public_product_detail_by_slug(self, slug: str) -> Product | None:
        statement = (
            select(Product)
            .where(
                Product.slug == slug,
                Product.status == "active",
                Product.deleted_at.is_(None),
                Product.published_at.is_not(None),
            )
            .options(
                selectinload(Product.brand),
                selectinload(Product.categories).selectinload(ProductCategory.category).selectinload(Category.parent),
                selectinload(Product.images).selectinload(ProductImage.media),
                selectinload(Product.variants)
                .selectinload(ProductVariant.attribute_values)
                .selectinload(VariantAttributeValue.attribute_value)
                .selectinload(ProductAttributeValue.attribute),
            )
        )
        return self.session.scalar(statement)

    def get_product(self, product_id: UUID) -> Product | None:
        product = self.session.get(Product, product_id)

        if product is None or product.deleted_at is not None:
            return None

        return product

    def get_product_by_slug(self, slug: str) -> Product | None:
        return self.session.scalar(select(Product).where(Product.slug == slug, Product.deleted_at.is_(None)))

    def get_product_by_sku(self, sku: str) -> Product | None:
        return self.session.scalar(select(Product).where(Product.sku == sku))

    def add_product(self, product: Product) -> Product:
        self.session.add(product)
        self.session.flush()
        return product

    def set_product_categories(self, product: Product, category_ids: list[UUID]) -> None:
        self.session.query(ProductCategory).filter(ProductCategory.product_id == product.id).delete(synchronize_session=False)

        for category_id in category_ids:
            self.session.add(ProductCategory(product_id=product.id, category_id=category_id))

        self.session.flush()

    def list_variants(self, *, offset: int, limit: int) -> tuple[list[ProductVariant], int]:
        return self._list_with_total(
            select(ProductVariant).order_by(ProductVariant.created_at.desc()),
            offset=offset,
            limit=limit,
        )

    def get_variant(self, variant_id: UUID) -> ProductVariant | None:
        return self.session.get(ProductVariant, variant_id)

    def get_variant_by_sku(self, sku: str) -> ProductVariant | None:
        return self.session.scalar(select(ProductVariant).where(ProductVariant.sku == sku))

    def add_variant(self, variant: ProductVariant) -> ProductVariant:
        self.session.add(variant)
        self.session.flush()
        return variant

    def delete_variant(self, variant: ProductVariant) -> None:
        self.session.delete(variant)

    def _list_with_total(self, statement, *, offset: int, limit: int):
        total = self.session.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        rows = list(self.session.scalars(statement.offset(offset).limit(limit)).all())
        return rows, total
