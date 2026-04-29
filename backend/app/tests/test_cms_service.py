from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.content import Page, Post, SeoMetadata
from app.models.identity import User
from app.schemas.cms import PageCreateRequest, RedirectCreateRequest, TagCreateRequest
from app.services.cms import CmsService, CmsServiceError


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    with session_factory() as db_session:
        yield db_session

    Base.metadata.drop_all(engine)


def test_create_page_sets_actor_and_published_at(session: Session) -> None:
    actor = _seed_user(session)

    page = CmsService(session).create_page(
        PageCreateRequest(title="About", slug="About", content={"blocks": []}, status="published"),
        actor,
    )

    assert page.slug == "about"
    assert page.created_by == actor.id
    assert page.updated_by == actor.id
    assert page.published_at is not None


def test_create_page_rejects_duplicate_slug(session: Session) -> None:
    actor = _seed_user(session)
    service = CmsService(session)
    service.create_page(PageCreateRequest(title="About", slug="about", content={"blocks": []}), actor)

    with pytest.raises(CmsServiceError) as exc_info:
        service.create_page(PageCreateRequest(title="Duplicate", slug="about", content={"blocks": []}), actor)

    assert exc_info.value.code == "PAGE_SLUG_EXISTS"


def test_create_tag_rejects_duplicate_slug(session: Session) -> None:
    service = CmsService(session)
    service.create_tag(TagCreateRequest(name="News", slug="news"))

    with pytest.raises(CmsServiceError) as exc_info:
        service.create_tag(TagCreateRequest(name="Duplicate", slug="news"))

    assert exc_info.value.code == "TAG_SLUG_EXISTS"


def test_create_redirect_rejects_invalid_status_code(session: Session) -> None:
    with pytest.raises(CmsServiceError) as exc_info:
        CmsService(session).create_redirect(
            RedirectCreateRequest(from_path="/old", to_path="/new", status_code=200)
        )

    assert exc_info.value.code == "INVALID_REDIRECT_STATUS"


def test_public_page_hides_unpublished_page(session: Session) -> None:
    session.add(Page(title="Draft", slug="draft", content={"blocks": []}, status="draft"))
    session.commit()

    with pytest.raises(CmsServiceError) as exc_info:
        CmsService(session).get_public_page("draft")

    assert exc_info.value.code == "PAGE_NOT_FOUND"


def test_public_posts_include_seo_metadata(session: Session) -> None:
    post = Post(
        title="Public post",
        slug="public-post",
        summary="Summary",
        content={"blocks": []},
        status="published",
        published_at=datetime.now(UTC),
    )
    session.add(post)
    session.flush()
    session.add(SeoMetadata(entity_type="post", entity_id=post.id, meta_title="Public SEO"))
    session.commit()

    result = CmsService(session).list_public_posts(page=1, page_size=20)

    assert result.total == 1
    assert result.rows[0].seo is not None
    assert result.rows[0].seo.meta_title == "Public SEO"


def _seed_user(session: Session) -> User:
    user = User(email="cms@example.com", password_hash="hash", full_name="CMS User")
    session.add(user)
    session.commit()
    return user
