from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.catalog import Brand, Category


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


def test_public_brands_returns_active_brands_only_with_pagination(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_brands(session)

    response = client.get("/api/v1/brands", params={"page": 1, "page_size": 2})
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["meta"] == {"page": 1, "page_size": 2, "total": 2, "total_pages": 1}
    assert [brand["slug"] for brand in payload["data"]] == ["acme", "zen"]


def test_public_brand_detail_hides_inactive_brand(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_brands(session)

    active_response = client.get("/api/v1/brands/acme")
    inactive_response = client.get("/api/v1/brands/hidden-brand")

    assert active_response.status_code == 200
    assert active_response.json()["data"]["description"] == "Active brand"
    assert inactive_response.status_code == 404
    assert inactive_response.json()["error"]["code"] == "BRAND_NOT_FOUND"


def test_public_categories_returns_active_categories_only_with_pagination(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_categories(session)

    response = client.get("/api/v1/categories", params={"page": 1, "page_size": 2})
    payload = response.json()

    assert response.status_code == 200
    assert payload["meta"] == {"page": 1, "page_size": 2, "total": 3, "total_pages": 2}
    assert [category["slug"] for category in payload["data"]] == ["health", "supplements"]


def test_public_category_detail_returns_children_and_breadcrumbs(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_categories(session)

    response = client.get("/api/v1/categories/supplements")
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["data"]["slug"] == "supplements"
    assert [child["slug"] for child in payload["data"]["children"]] == ["vitamins"]
    assert [breadcrumb["path"] for breadcrumb in payload["data"]["breadcrumbs"]] == [
        "/",
        "/categories/health",
        "/categories/supplements",
    ]


def test_public_category_detail_hides_inactive_category(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_categories(session)

    response = client.get("/api/v1/categories/hidden")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CATEGORY_NOT_FOUND"


def test_public_taxonomy_rejects_invalid_pagination(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_brands(session)
        _seed_categories(session)

    brands_response = client.get("/api/v1/brands", params={"page": 0})
    categories_response = client.get("/api/v1/categories", params={"page_size": 101})

    assert brands_response.status_code == 400
    assert brands_response.json()["error"]["code"] == "INVALID_PAGE"
    assert categories_response.status_code == 400
    assert categories_response.json()["error"]["code"] == "INVALID_PAGE_SIZE"


def _seed_brands(session: Session) -> None:
    session.add_all(
        [
            Brand(name="Acme", slug="acme", description="Active brand", is_active=True),
            Brand(name="Zen", slug="zen", description="Another brand", is_active=True),
            Brand(name="Hidden Brand", slug="hidden-brand", is_active=False),
        ]
    )
    session.commit()


def _seed_categories(session: Session) -> None:
    health = Category(name="Health", slug="health", description="Health products", sort_order=1, is_active=True)
    supplements = Category(
        name="Supplements",
        slug="supplements",
        parent=health,
        description="Supplements",
        sort_order=2,
        is_active=True,
    )
    vitamins = Category(name="Vitamins", slug="vitamins", parent=supplements, sort_order=3, is_active=True)
    hidden = Category(name="Hidden", slug="hidden", parent=supplements, sort_order=4, is_active=False)
    session.add_all([health, supplements, vitamins, hidden])
    session.commit()
