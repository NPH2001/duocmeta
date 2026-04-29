from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings
from app.models.base import Base
from app.models.catalog import MediaDerivative, MediaFile
from app.models.identity import User
from app.schemas.media import MediaCompleteRequest, MediaPresignRequest
from app.services.media import MediaService, MediaServiceError


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


def test_presigned_upload_contains_storage_key_and_signature(session: Session) -> None:
    response = MediaService(session, _settings()).create_presigned_upload(
        MediaPresignRequest(filename="Product Image.png", mime_type="image/png", size_bytes=1024)
    )

    assert response.method == "PUT"
    assert response.bucket == "test-media"
    assert response.storage_key.startswith("uploads/")
    assert response.storage_key.endswith("-Product-Image.png")
    assert "signature=" in response.upload_url
    assert response.headers["Content-Type"] == "image/png"


def test_presigned_upload_rejects_disallowed_mime_type(session: Session) -> None:
    with pytest.raises(MediaServiceError) as exc_info:
        MediaService(session, _settings()).create_presigned_upload(
            MediaPresignRequest(filename="script.js", mime_type="application/javascript", size_bytes=1024)
        )

    assert exc_info.value.code == "MEDIA_MIME_TYPE_NOT_ALLOWED"


def test_complete_upload_records_media_metadata(session: Session) -> None:
    user = User(email="media@example.com", password_hash="hash", full_name="Media User")
    session.add(user)
    session.commit()

    media_file = MediaService(session, _settings()).complete_upload(
        MediaCompleteRequest(
            storage_key="uploads/2026/04/28/image.png",
            filename="image.png",
            mime_type="image/png",
            size_bytes=2048,
            width=1200,
            height=630,
            alt_text="Product image",
        ),
        user,
    )

    persisted = session.get(MediaFile, media_file.id)
    assert persisted is not None
    assert persisted.storage_key == "uploads/2026/04/28/image.png"
    assert persisted.uploaded_by == user.id
    assert persisted.alt_text == "Product image"


def test_complete_upload_plans_image_optimization_derivatives(session: Session) -> None:
    user = User(email="media@example.com", password_hash="hash", full_name="Media User")
    session.add(user)
    session.commit()

    media_file = MediaService(session, _settings()).complete_upload(
        MediaCompleteRequest(
            storage_key="uploads/2026/04/28/image.png",
            filename="image.png",
            mime_type="image/png",
            size_bytes=4096,
            width=1600,
            height=900,
        ),
        user,
    )

    derivatives = session.query(MediaDerivative).filter(MediaDerivative.media_file_id == media_file.id).all()

    assert [derivative.kind for derivative in derivatives] == ["w320", "w1200"]
    assert derivatives[0].storage_key == "optimized/uploads/2026/04/28/image-w320.webp"
    assert derivatives[0].mime_type == "image/webp"
    assert derivatives[0].width == 320
    assert derivatives[0].height == 180
    assert derivatives[0].status == "pending"
    assert derivatives[1].width == 1200
    assert derivatives[1].height == 675


def test_complete_upload_does_not_plan_derivatives_for_pdf(session: Session) -> None:
    user = User(email="media@example.com", password_hash="hash", full_name="Media User")
    session.add(user)
    session.commit()

    media_file = MediaService(session, _settings()).complete_upload(
        MediaCompleteRequest(
            storage_key="uploads/2026/04/28/spec.pdf",
            filename="spec.pdf",
            mime_type="application/pdf",
            size_bytes=4096,
        ),
        user,
    )

    derivatives = session.query(MediaDerivative).filter(MediaDerivative.media_file_id == media_file.id).all()

    assert derivatives == []


def test_complete_upload_rejects_duplicate_storage_key(session: Session) -> None:
    user = User(email="media@example.com", password_hash="hash", full_name="Media User")
    session.add(user)
    session.add(
        MediaFile(
            storage_key="uploads/existing.png",
            filename="existing.png",
            mime_type="image/png",
            size_bytes=100,
        )
    )
    session.commit()

    with pytest.raises(MediaServiceError) as exc_info:
        MediaService(session, _settings()).complete_upload(
            MediaCompleteRequest(
                storage_key="uploads/existing.png",
                filename="existing.png",
                mime_type="image/png",
                size_bytes=100,
            ),
            user,
        )

    assert exc_info.value.code == "MEDIA_STORAGE_KEY_EXISTS"


def _settings() -> Settings:
    return Settings(
        secret_key="test-secret",
        media_bucket_name="test-media",
        media_upload_base_url="https://uploads.example.test",
        media_public_base_url="https://cdn.example.test",
    )
