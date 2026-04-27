from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.catalog import (
    Brand,
    Category,
    MediaFile,
    Product,
    ProductAttribute,
    ProductAttributeValue,
    ProductCategory,
    ProductImage,
    ProductVariant,
    VariantAttributeValue,
)


@pytest.fixture()
def client_with_session() -> Generator[tuple[TestClient, sessionmaker[Session]], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    def override_db_session() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db_session

    with TestClient(app) as test_client:
        yield test_client, session_factory

    app.dependency_overrides.pop(get_db_session, None)
    Base.metadata.drop_all(engine)


def test_public_product_detail_returns_detail_payload(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        product_slug = _seed_public_detail_product(session)

    response = client.get(f"/api/v1/products/{product_slug}")
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["data"]["slug"] == "vitamin-c"
    assert payload["data"]["brand"]["slug"] == "acme"
    assert [category["slug"] for category in payload["data"]["categories"]] == ["supplements"]
    assert [variant["sku"] for variant in payload["data"]["variants"]] == ["VIT-C-100"]
    assert payload["data"]["variants"][0]["attributes"][0]["value_code"] == "100-tabs"
    assert [image["filename"] for image in payload["data"]["images"]] == ["vitamin-c.jpg"]
    assert payload["data"]["attributes"][0]["code"] == "pack-size"
    assert [value["value_code"] for value in payload["data"]["attributes"][0]["values"]] == ["100-tabs"]
    assert [breadcrumb["path"] for breadcrumb in payload["data"]["breadcrumbs"]] == [
        "/",
        "/categories/health",
        "/categories/supplements",
        "/products/vitamin-c",
    ]
    assert payload["data"]["seo"] == {
        "title": "Vitamin C",
        "description": "Daily immune support",
        "canonical_path": "/products/vitamin-c",
    }


@pytest.mark.parametrize(
    ("slug", "status", "published_at", "deleted"),
    [
        ("draft-product", "draft", None, False),
        ("archived-product", "archived", datetime.now(UTC), False),
        ("unpublished-product", "active", None, False),
        ("deleted-product", "active", datetime.now(UTC), True),
    ],
)
def test_public_product_detail_hides_non_public_products(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
    slug: str,
    status: str,
    published_at: datetime | None,
    deleted: bool,
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_visibility_product(
            session,
            slug=slug,
            status=status,
            published_at=published_at,
            deleted=deleted,
        )

    response = client.get(f"/api/v1/products/{slug}")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PRODUCT_NOT_FOUND"


def _seed_public_detail_product(session: Session) -> str:
    brand = Brand(name="Acme", slug="acme", is_active=True)
    parent_category = Category(name="Health", slug="health", is_active=True, sort_order=1)
    category = Category(name="Supplements", slug="supplements", parent=parent_category, is_active=True, sort_order=2)
    inactive_category = Category(name="Hidden", slug="hidden", is_active=False)
    product = Product(
        brand=brand,
        name="Vitamin C",
        slug="vitamin-c",
        sku="VIT-C",
        short_description="Daily immune support",
        description="Buffered vitamin C tablets.",
        status="active",
        product_type="simple",
        currency_code="VND",
        min_price=Decimal("100000.00"),
        max_price=Decimal("120000.00"),
        published_at=datetime.now(UTC),
    )
    media = MediaFile(
        storage_key="products/vitamin-c.jpg",
        filename="vitamin-c.jpg",
        mime_type="image/jpeg",
        size_bytes=1024,
        width=800,
        height=800,
        alt_text="Vitamin C bottle",
    )
    attribute = ProductAttribute(code="pack-size", name="Pack size", input_type="select", is_variant_axis=True)
    value = ProductAttributeValue(attribute=attribute, value_code="100-tabs", display_value="100 tablets", sort_order=1)
    hidden_value = ProductAttributeValue(attribute=attribute, value_code="30-tabs", display_value="30 tablets", sort_order=2)
    session.add_all([brand, parent_category, category, inactive_category, product, media, attribute, value, hidden_value])
    session.flush()

    active_variant = ProductVariant(product_id=product.id, sku="VIT-C-100", price=Decimal("100000.00"), status="active")
    inactive_variant = ProductVariant(product_id=product.id, sku="VIT-C-30", price=Decimal("60000.00"), status="draft")
    session.add_all([active_variant, inactive_variant])
    session.flush()

    product.default_variant_id = active_variant.id
    session.add_all(
        [
            ProductCategory(product_id=product.id, category_id=category.id, is_primary=True),
            ProductCategory(product_id=product.id, category_id=inactive_category.id),
            ProductImage(product_id=product.id, media_id=media.id, sort_order=1, is_primary=True),
            ProductImage(product_id=product.id, variant_id=inactive_variant.id, media_id=media.id, sort_order=2),
            VariantAttributeValue(variant_id=active_variant.id, attribute_value_id=value.id),
            VariantAttributeValue(variant_id=inactive_variant.id, attribute_value_id=hidden_value.id),
        ]
    )
    session.commit()
    return "vitamin-c"


def _seed_visibility_product(
    session: Session,
    *,
    slug: str,
    status: str,
    published_at: datetime | None,
    deleted: bool,
) -> None:
    product = Product(
        name=slug.replace("-", " ").title(),
        slug=slug,
        status=status,
        published_at=published_at,
        deleted_at=datetime.now(UTC) if deleted else None,
    )
    session.add(product)
    session.commit()
