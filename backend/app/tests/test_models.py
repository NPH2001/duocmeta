from app.models.base import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ExampleModel(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "example_models"


def test_uuid_primary_key_mixin_defines_id_column() -> None:
    id_column = ExampleModel.__table__.c.id

    assert id_column.primary_key is True
    assert id_column.nullable is False
    assert str(id_column.type) == "UUID"


def test_timestamp_mixin_defines_created_and_updated_columns() -> None:
    created_at = ExampleModel.__table__.c.created_at
    updated_at = ExampleModel.__table__.c.updated_at

    assert created_at.nullable is False
    assert updated_at.nullable is False
    assert created_at.server_default is not None
    assert updated_at.server_default is not None


def test_soft_delete_mixin_defines_optional_deleted_at_column() -> None:
    deleted_at = ExampleModel.__table__.c.deleted_at

    assert deleted_at.nullable is True
