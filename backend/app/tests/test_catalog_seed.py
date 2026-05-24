from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.catalog import Brand, Category, MediaFile, Product, ProductCategory, ProductImage, ProductVariant
from app.services.catalog_seed import CATALOG_PRODUCT_SEEDS, seed_oncology_catalog


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, class_=Session)

    with factory() as db_session:
        yield db_session

    Base.metadata.drop_all(engine)


def test_seed_oncology_catalog_creates_lupus_and_oncology_reference_products(session: Session) -> None:
    seed_oncology_catalog(session)

    products = session.scalars(select(Product).order_by(Product.slug)).all()
    categories = session.scalars(select(Category).order_by(Category.slug)).all()

    assert {category.slug for category in categories} == {"thuoc-dieu-tri-lupus", "thuoc-dieu-tri-ung-thu"}
    assert {product.slug for product in products} == {seed.slug for seed in CATALOG_PRODUCT_SEEDS}
    assert all(product.status == "active" for product in products)
    assert all(product.published_at is not None for product in products)
    assert all(product.currency_code == "VND" for product in products)
    assert all(product.min_price is None and product.max_price is None for product in products)
    assert all(product.product_type in {"prescription_reference", "drug_class_reference"} for product in products)
    assert session.scalar(select(func.count()).select_from(ProductImage)) == len(CATALOG_PRODUCT_SEEDS)
    assert session.scalar(select(func.count()).select_from(MediaFile)) == len(CATALOG_PRODUCT_SEEDS)
    assert session.scalar(select(func.count()).select_from(ProductCategory)) == len(CATALOG_PRODUCT_SEEDS)


def test_seed_oncology_catalog_is_idempotent(session: Session) -> None:
    seed_oncology_catalog(session)
    seed_oncology_catalog(session)

    assert session.scalar(select(func.count()).select_from(Brand)) == 4
    assert session.scalar(select(func.count()).select_from(Category)) == 2
    assert session.scalar(select(func.count()).select_from(Product)) == len(CATALOG_PRODUCT_SEEDS)
    assert session.scalar(select(func.count()).select_from(ProductVariant)) == len(CATALOG_PRODUCT_SEEDS)
    assert session.scalar(select(func.count()).select_from(ProductImage)) == len(CATALOG_PRODUCT_SEEDS)

    variants = session.scalars(select(ProductVariant)).all()
    assert all(variant.status == "draft" for variant in variants)
