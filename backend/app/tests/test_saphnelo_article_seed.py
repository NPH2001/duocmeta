from collections.abc import Generator
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.content import Post, SeoMetadata, Tag
from app.scripts.seed_saphnelo_article import ARTICLE_SLUG, seed_saphnelo_article


def test_seed_saphnelo_article_is_idempotent() -> None:
    with _session_factory() as session:
        first = seed_saphnelo_article(session)
        second = seed_saphnelo_article(session)

        posts = session.query(Post).filter(Post.deleted_at.is_(None)).all()
        seo = session.query(SeoMetadata).filter(SeoMetadata.entity_type == "post").all()
        tags = session.query(Tag).order_by(Tag.slug.asc()).all()

        assert first.id == second.id
        assert len(posts) == 1
        assert posts[0].slug == ARTICLE_SLUG
        assert posts[0].status == "published"
        assert posts[0].published_at == datetime(2026, 5, 6, tzinfo=UTC)
        assert posts[0].summary
        assert posts[0].content["blocks"][0]["type"] == "paragraph"
        assert len(posts[0].tags) == 2
        assert {tag.slug for tag in tags} == {"lupus", "saphnelo"}
        assert len(seo) == 1
        assert seo[0].canonical_url == f"/blog/{ARTICLE_SLUG}"
        assert seo[0].meta_title is not None


@contextmanager
def _session_factory() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_now(dbapi_connection: Any, _connection_record: Any) -> None:
        dbapi_connection.create_function("now", 0, lambda: datetime.now(UTC).isoformat())

    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)

    try:
        with session_factory() as session:
            yield session
    finally:
        Base.metadata.drop_all(engine)
