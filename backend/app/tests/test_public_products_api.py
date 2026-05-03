from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.catalog import Brand, Category, Product, ProductCategory


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


def test_public_products_returns_only_active_published_products(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_public_listing_products(session)

    response = client.get("/api/v1/products")
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["meta"]["total"] == 3
    assert [product["slug"] for product in payload["data"]] == ["omega", "vitamin-c", "protein"]


def test_public_products_supports_brand_category_search_price_and_sort_filters(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_public_listing_products(session)

    response = client.get(
        "/api/v1/products",
        params={
            "q": "vitamin",
            "brand_slug": "acme",
            "category_slug": "supplements",
            "min_price": "90000",
            "max_price": "150000",
            "sort": "price_asc",
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["slug"] == "vitamin-c"


def test_public_products_supports_pagination_and_rejects_invalid_sort(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_public_listing_products(session)

    page_response = client.get("/api/v1/products", params={"page": 2, "page_size": 2})
    invalid_sort_response = client.get("/api/v1/products", params={"sort": "unsupported"})

    assert page_response.status_code == 200
    assert page_response.json()["meta"] == {"page": 2, "page_size": 2, "total": 3, "total_pages": 2}
    assert [product["slug"] for product in page_response.json()["data"]] == ["protein"]
    assert invalid_sort_response.status_code == 400
    assert invalid_sort_response.json()["error"]["code"] == "INVALID_SORT"


def _seed_public_listing_products(session: Session) -> None:
    acme = Brand(name="Acme", slug="acme", is_active=True)
    supplements = Category(name="Supplements", slug="supplements", is_active=True)
    equipment = Category(name="Equipment", slug="equipment", is_active=True)
    session.add_all([acme, supplements, equipment])
    session.flush()

    now = datetime.now(UTC)
    vitamin = Product(
        brand_id=acme.id,
        name="Vitamin C",
        slug="vitamin-c",
        status="active",
        min_price=Decimal("100000.00"),
        max_price=Decimal("120000.00"),
        published_at=now - timedelta(days=1),
    )
    omega = Product(
        brand_id=acme.id,
        name="Omega",
        slug="omega",
        status="active",
        min_price=Decimal("200000.00"),
        max_price=Decimal("250000.00"),
        published_at=now,
    )
    protein = Product(
        brand_id=acme.id,
        name="Protein",
        slug="protein",
        status="active",
        min_price=Decimal("300000.00"),
        max_price=Decimal("350000.00"),
        published_at=now - timedelta(days=2),
    )
    draft = Product(
        brand_id=acme.id,
        name="Draft Product",
        slug="draft-product",
        status="draft",
        published_at=None,
    )
    session.add_all([vitamin, omega, protein, draft])
    session.flush()

    session.add_all(
        [
            ProductCategory(product_id=vitamin.id, category_id=supplements.id),
            ProductCategory(product_id=omega.id, category_id=supplements.id),
            ProductCategory(product_id=protein.id, category_id=equipment.id),
            ProductCategory(product_id=draft.id, category_id=supplements.id),
        ]
    )
    session.commit()


def test_public_product_filters_do_not_match_inactive_taxonomy(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        hidden_brand = Brand(name="Hidden Brand", slug="hidden-brand", is_active=False)
        hidden_category = Category(name="Hidden Category", slug="hidden-category", is_active=False)
        product = Product(
            brand=hidden_brand,
            name="Hidden Taxonomy Product",
            slug="hidden-taxonomy-product",
            status="active",
            published_at=datetime.now(UTC),
        )
        session.add_all([hidden_brand, hidden_category, product])
        session.flush()
        session.add(ProductCategory(product_id=product.id, category_id=hidden_category.id))
        session.commit()

    brand_response = client.get("/api/v1/products", params={"brand_slug": "hidden-brand"})
    category_response = client.get("/api/v1/products", params={"category_slug": "hidden-category"})

    assert brand_response.status_code == 200
    assert brand_response.json()["meta"]["total"] == 0
    assert brand_response.json()["data"] == []
    assert category_response.status_code == 200
    assert category_response.json()["meta"]["total"] == 0
    assert category_response.json()["data"] == []
