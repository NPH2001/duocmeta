from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import get_db_session
from app.main import app
from app.models.base import Base
from app.models.content import Page, Post, PostTag, Redirect, SeoMetadata, Tag


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


def test_public_page_detail_returns_published_page_with_seo(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        page = _seed_page(session, slug="about", title="About")
        session.add(
            SeoMetadata(
                entity_type="page",
                entity_id=page.id,
                meta_title="About SEO",
                meta_description="About description",
                canonical_url="/pages/about",
                robots="index,follow",
            )
        )
        session.commit()

    response = client.get("/api/v1/pages/about")
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["data"]["slug"] == "about"
    assert payload["data"]["content"] == {"blocks": [{"type": "paragraph"}]}
    assert payload["data"]["seo"]["meta_title"] == "About SEO"
    assert payload["data"]["seo"]["canonical_url"] == "/pages/about"


@pytest.mark.parametrize(
    ("slug", "status", "published_at", "deleted"),
    [
        ("draft-page", "draft", None, False),
        ("archived-page", "archived", datetime.now(UTC), False),
        ("future-page", "published", datetime.now(UTC) + timedelta(days=1), False),
        ("deleted-page", "published", datetime.now(UTC), True),
    ],
)
def test_public_page_detail_hides_non_public_pages(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
    slug: str,
    status: str,
    published_at: datetime | None,
    deleted: bool,
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_page(session, slug=slug, title=slug, status=status, published_at=published_at, deleted=deleted)

    response = client.get(f"/api/v1/pages/{slug}")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PAGE_NOT_FOUND"


def test_public_posts_returns_published_posts_with_pagination_and_tags(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        tag = Tag(name="News", slug="news", is_active=True)
        session.add(tag)
        session.flush()
        first = _seed_post(session, slug="first", title="First", published_at=datetime.now(UTC) - timedelta(days=1))
        second = _seed_post(session, slug="second", title="Second", published_at=datetime.now(UTC))
        hidden = _seed_post(session, slug="hidden", title="Hidden", status="draft", published_at=None)
        session.add(PostTag(post_id=second.id, tag_id=tag.id))
        session.add(SeoMetadata(entity_type="post", entity_id=second.id, meta_title="Second SEO"))
        session.commit()

    response = client.get("/api/v1/posts", params={"page": 1, "page_size": 10})
    payload = response.json()

    assert hidden.slug == "hidden"
    assert first.slug == "first"
    assert response.status_code == 200
    assert payload["meta"] == {"page": 1, "page_size": 10, "total": 2, "total_pages": 1}
    assert [post["slug"] for post in payload["data"]] == ["second", "first"]
    assert payload["data"][0]["tag_ids"] == [str(tag.id)]
    assert payload["data"][0]["seo"]["meta_title"] == "Second SEO"


def test_public_post_detail_returns_published_post_and_hides_draft(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        _seed_post(session, slug="public-post", title="Public post")
        _seed_post(session, slug="draft-post", title="Draft post", status="draft", published_at=None)

    public_response = client.get("/api/v1/posts/public-post")
    draft_response = client.get("/api/v1/posts/draft-post")

    assert public_response.status_code == 200
    assert public_response.json()["data"]["content"] == {"blocks": [{"type": "paragraph"}]}
    assert draft_response.status_code == 404
    assert draft_response.json()["error"]["code"] == "POST_NOT_FOUND"


def test_public_cms_rejects_invalid_pagination(client_with_session: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = client_with_session

    response = client.get("/api/v1/posts", params={"page_size": 101})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_PAGE_SIZE"


def test_public_redirect_resolver_returns_active_redirect(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        session.add(Redirect(from_path="/old-path", to_path="/pages/new-path", status_code=301, is_active=True))
        session.commit()

    response = client.get("/api/v1/redirects/resolve", params={"from_path": "old-path"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["error"] is None
    assert payload["data"] == {
        "from_path": "/old-path",
        "to_path": "/pages/new-path",
        "status_code": 301,
    }


def test_public_redirect_resolver_hides_inactive_redirect(
    client_with_session: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = client_with_session
    with session_factory() as session:
        session.add(Redirect(from_path="/inactive", to_path="/pages/new-path", status_code=301, is_active=False))
        session.commit()

    response = client.get("/api/v1/redirects/resolve", params={"from_path": "/inactive"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "REDIRECT_NOT_FOUND"


def _seed_page(
    session: Session,
    *,
    slug: str,
    title: str,
    status: str = "published",
    published_at: datetime | None = None,
    deleted: bool = False,
) -> Page:
    page = Page(
        title=title,
        slug=slug,
        content={"blocks": [{"type": "paragraph"}]},
        status=status,
        published_at=published_at if published_at is not None else datetime.now(UTC),
        deleted_at=datetime.now(UTC) if deleted else None,
    )
    session.add(page)
    session.flush()
    return page


def _seed_post(
    session: Session,
    *,
    slug: str,
    title: str,
    status: str = "published",
    published_at: datetime | None = None,
) -> Post:
    post = Post(
        title=title,
        slug=slug,
        summary=f"{title} summary",
        content={"blocks": [{"type": "paragraph"}]},
        status=status,
        published_at=published_at if published_at is not None else datetime.now(UTC),
    )
    session.add(post)
    session.flush()
    return post
