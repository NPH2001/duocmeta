from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.identity import User
from app.schemas.catalog import ProductCreateRequest
from app.services.catalog import CatalogService, CatalogServiceError


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


def test_catalog_service_publish_and_archive_product(session: Session) -> None:
    actor = User(email="admin@example.com", password_hash="hash", full_name="Admin User")
    session.add(actor)
    session.commit()

    service = CatalogService(session)
    product = service.create_product(
        ProductCreateRequest(name="Vitamin C", slug="vitamin-c", sku="VC-BASE"),
        actor,
    )
    published = service.publish_product(product.id, actor)
    published_at = published.published_at
    published_status = published.status
    archived = service.archive_product(product.id, actor)

    assert published_status == "active"
    assert published_at is not None
    assert archived.status == "archived"
    assert archived.updated_by == actor.id


def test_catalog_service_rejects_duplicate_active_product_slug(session: Session) -> None:
    actor = User(email="admin@example.com", password_hash="hash", full_name="Admin User")
    session.add(actor)
    session.commit()

    service = CatalogService(session)
    service.create_product(ProductCreateRequest(name="Vitamin C", slug="vitamin-c"), actor)

    with pytest.raises(CatalogServiceError) as exc_info:
        service.create_product(ProductCreateRequest(name="Vitamin C Duplicate", slug="vitamin-c"), actor)

    assert exc_info.value.code == "PRODUCT_SLUG_EXISTS"
