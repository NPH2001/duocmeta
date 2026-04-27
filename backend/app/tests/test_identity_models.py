from app.models.base import Base
from app.models.identity import Address, Permission, RefreshToken, Role, RolePermission, User, UserRole


def test_identity_tables_are_registered_on_metadata() -> None:
    expected_tables = {
        "addresses",
        "permissions",
        "refresh_tokens",
        "role_permissions",
        "roles",
        "user_roles",
        "users",
    }

    assert expected_tables.issubset(Base.metadata.tables)


def test_user_model_defines_soft_delete_and_active_email_index() -> None:
    users_table = User.__table__
    index_names = {index.name for index in users_table.indexes}

    assert users_table.c.deleted_at.nullable is True
    assert users_table.c.email.nullable is False
    assert "ix_users_email_active" in index_names
    assert "ix_users_status" in index_names


def test_role_permission_models_define_unique_codes() -> None:
    assert Role.__table__.c.code.unique is True
    assert Permission.__table__.c.code.unique is True


def test_join_tables_use_composite_primary_keys() -> None:
    assert {column.name for column in UserRole.__table__.primary_key.columns} == {"user_id", "role_id"}
    assert {column.name for column in RolePermission.__table__.primary_key.columns} == {
        "role_id",
        "permission_id",
    }


def test_refresh_token_model_supports_rotation_state() -> None:
    refresh_tokens_table = RefreshToken.__table__

    assert refresh_tokens_table.c.token_hash.unique is True
    assert refresh_tokens_table.c.expires_at.nullable is False
    assert refresh_tokens_table.c.revoked_at.nullable is True


def test_address_model_matches_required_shipping_fields() -> None:
    addresses_table = Address.__table__

    assert addresses_table.c.user_id.nullable is True
    assert addresses_table.c.full_name.nullable is False
    assert addresses_table.c.phone.nullable is False
    assert addresses_table.c.address_line1.nullable is False
    assert addresses_table.c.is_default.nullable is False
