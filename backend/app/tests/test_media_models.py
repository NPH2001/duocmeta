from app.models.base import Base
from app.models.catalog import MediaFile
from app.models.identity import User


def test_media_files_table_is_registered_on_metadata() -> None:
    assert "media_files" in Base.metadata.tables


def test_media_file_model_matches_required_storage_fields() -> None:
    media_files_table = MediaFile.__table__
    index_names = {index.name for index in media_files_table.indexes}

    assert media_files_table.c.storage_key.nullable is False
    assert media_files_table.c.storage_key.unique is True
    assert media_files_table.c.filename.nullable is False
    assert media_files_table.c.mime_type.nullable is False
    assert media_files_table.c.size_bytes.nullable is False
    assert str(media_files_table.c.size_bytes.type) == "BIGINT"
    assert media_files_table.c.width.nullable is True
    assert media_files_table.c.height.nullable is True
    assert media_files_table.c.alt_text.nullable is True
    assert media_files_table.c.created_at.nullable is False
    assert "ix_media_files_mime_type" in index_names


def test_media_file_model_supports_optional_uploader_relationship() -> None:
    media_files_table = MediaFile.__table__
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in media_files_table.foreign_keys}
    index_names = {index.name for index in media_files_table.indexes}

    assert media_files_table.c.uploaded_by.nullable is True
    assert str(foreign_keys["uploaded_by"].column) == "users.id"
    assert foreign_keys["uploaded_by"].ondelete == "SET NULL"
    assert MediaFile.uploader.property.back_populates == "media_files"
    assert User.media_files.property.back_populates == "uploader"
    assert "ix_media_files_uploaded_by" in index_names
