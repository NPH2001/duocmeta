import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


if TYPE_CHECKING:
    from app.models.commerce import CartItem, OrderItem
    from app.models.identity import User


class Brand(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "brands"
    __table_args__ = (Index("ix_brands_is_active", "is_active"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_files.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    logo_media: Mapped["MediaFile | None"] = relationship(foreign_keys=[logo_media_id])
    products: Mapped[list["Product"]] = relationship(back_populates="brand")


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = (
        Index("ix_categories_parent_id", "parent_id"),
        Index("ix_categories_is_active", "is_active"),
        Index("ix_categories_sort_order", "sort_order"),
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    parent: Mapped["Category | None"] = relationship(
        back_populates="children",
        remote_side=lambda: [Category.id],
    )
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    products: Mapped[list["ProductCategory"]] = relationship(back_populates="category")


class MediaFile(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "media_files"
    __table_args__ = (
        Index("ix_media_files_uploaded_by", "uploaded_by"),
        Index("ix_media_files_mime_type", "mime_type"),
    )

    storage_key: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    uploader: Mapped["User | None"] = relationship(back_populates="media_files")
    derivatives: Mapped[list["MediaDerivative"]] = relationship(
        back_populates="media_file",
        cascade="all, delete-orphan",
        order_by="MediaDerivative.width",
    )


class MediaDerivative(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_derivatives"
    __table_args__ = (
        UniqueConstraint("media_file_id", "kind", name="uq_media_derivatives_media_file_id_kind"),
        Index("ix_media_derivatives_media_file_id", "media_file_id"),
        Index("ix_media_derivatives_status", "status"),
    )

    media_file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_files.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="pending")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    media_file: Mapped[MediaFile] = relationship(back_populates="derivatives")


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_products_status", "status"),
        Index("ix_products_brand_id", "brand_id"),
        Index("ix_products_published_at", "published_at"),
    )

    brand_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="draft")
    product_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="simple")
    default_variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="SET NULL", use_alter=True),
        nullable=True,
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, server_default="VND")
    min_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    max_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    brand: Mapped[Brand | None] = relationship(back_populates="products")
    categories: Mapped[list["ProductCategory"]] = relationship(back_populates="product")
    creator: Mapped["User | None"] = relationship(foreign_keys=[created_by], back_populates="created_products")
    default_variant: Mapped["ProductVariant | None"] = relationship(foreign_keys=[default_variant_id], post_update=True)
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", foreign_keys="ProductImage.product_id")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
    updater: Mapped["User | None"] = relationship(foreign_keys=[updated_by], back_populates="updated_products")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", foreign_keys="ProductVariant.product_id")


class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        UniqueConstraint("product_id", "category_id", name="uq_product_categories_product_id_category_id"),
        Index("ix_product_categories_category_id", "category_id"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    product: Mapped[Product] = relationship(back_populates="categories")
    category: Mapped[Category] = relationship(back_populates="products")


class ProductAttribute(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "product_attributes"
    __table_args__ = (
        Index("ix_product_attributes_is_filterable", "is_filterable"),
        Index("ix_product_attributes_is_variant_axis", "is_variant_axis"),
    )

    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    input_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_filterable: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    is_variant_axis: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    values: Mapped[list["ProductAttributeValue"]] = relationship(back_populates="attribute")


class ProductAttributeValue(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "product_attribute_values"
    __table_args__ = (
        UniqueConstraint("attribute_id", "value_code", name="uq_product_attribute_values_attribute_id_value_code"),
        Index("ix_product_attribute_values_attribute_id", "attribute_id"),
        Index("ix_product_attribute_values_sort_order", "sort_order"),
    )

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_attributes.id", ondelete="CASCADE"),
        nullable=False,
    )
    value_code: Mapped[str] = mapped_column(String(100), nullable=False)
    display_value: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    attribute: Mapped[ProductAttribute] = relationship(back_populates="values")
    variants: Mapped[list["VariantAttributeValue"]] = relationship(back_populates="attribute_value")


class ProductVariant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_variants"
    __table_args__ = (
        Index("ix_product_variants_product_id", "product_id"),
        Index("ix_product_variants_status", "status"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    sku: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    weight_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    image_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_files.id", ondelete="SET NULL"),
        nullable=True,
    )

    attribute_values: Mapped[list["VariantAttributeValue"]] = relationship(back_populates="variant")
    image_media: Mapped[MediaFile | None] = relationship(foreign_keys=[image_media_id])
    images: Mapped[list["ProductImage"]] = relationship(back_populates="variant")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="variant")
    inventory_snapshot: Mapped["InventorySnapshot | None"] = relationship(back_populates="variant")
    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(back_populates="variant")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="variant")
    product: Mapped[Product] = relationship(back_populates="variants", foreign_keys=[product_id])


class VariantAttributeValue(Base):
    __tablename__ = "variant_attribute_values"
    __table_args__ = (
        UniqueConstraint(
            "variant_id",
            "attribute_value_id",
            name="uq_variant_attribute_values_variant_id_attribute_value_id",
        ),
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        primary_key=True,
    )
    attribute_value_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_attribute_values.id", ondelete="CASCADE"),
        primary_key=True,
    )

    attribute_value: Mapped[ProductAttributeValue] = relationship(back_populates="variants")
    variant: Mapped[ProductVariant] = relationship(back_populates="attribute_values")


class ProductImage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "product_images"
    __table_args__ = (
        Index("ix_product_images_product_id", "product_id"),
        Index("ix_product_images_variant_id", "variant_id"),
        Index("ix_product_images_media_id", "media_id"),
        Index("ix_product_images_sort_order", "sort_order"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="SET NULL"),
        nullable=True,
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_files.id", ondelete="RESTRICT"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    media: Mapped[MediaFile] = relationship(foreign_keys=[media_id])
    product: Mapped[Product] = relationship(back_populates="images", foreign_keys=[product_id])
    variant: Mapped[ProductVariant | None] = relationship(back_populates="images")


class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshots"

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        primary_key=True,
    )
    available_quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    reserved_quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    variant: Mapped[ProductVariant] = relationship(back_populates="inventory_snapshot")


class InventoryTransaction(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "inventory_transactions"
    __table_args__ = (
        Index("ix_inventory_transactions_variant_id", "variant_id"),
        Index("ix_inventory_transactions_transaction_type", "transaction_type"),
        Index("ix_inventory_transactions_reference", "reference_type", "reference_id"),
        Index("ix_inventory_transactions_created_at", "created_at"),
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    actor: Mapped["User | None"] = relationship(back_populates="inventory_transactions")
    variant: Mapped[ProductVariant] = relationship(back_populates="inventory_transactions")
