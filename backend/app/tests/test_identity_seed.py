from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.identity import Permission, Role, RolePermission
from app.services.identity_seed import PERMISSIONS, ROLE_PERMISSION_CODES, ROLES, seed_roles_and_permissions


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, class_=Session)

    with session_factory() as session:
        yield session

    Base.metadata.drop_all(engine)


def test_seed_roles_and_permissions_creates_expected_records(session: Session) -> None:
    seed_roles_and_permissions(session)

    role_codes = set(session.scalars(select(Role.code)).all())
    permission_codes = set(session.scalars(select(Permission.code)).all())

    assert role_codes == {role.code for role in ROLES}
    assert permission_codes == {permission.code for permission in PERMISSIONS}


def test_seed_roles_and_permissions_is_idempotent(session: Session) -> None:
    seed_roles_and_permissions(session)
    seed_roles_and_permissions(session)

    assert session.query(Role).count() == len(ROLES)
    assert session.query(Permission).count() == len(PERMISSIONS)
    assert session.query(RolePermission).count() == sum(
        len(permission_codes) for permission_codes in ROLE_PERMISSION_CODES.values()
    )


def test_admin_and_super_admin_receive_all_permissions(session: Session) -> None:
    seed_roles_and_permissions(session)

    all_permission_codes = {permission.code for permission in PERMISSIONS}

    for role_code in ("admin", "super_admin"):
        role = session.scalar(select(Role).where(Role.code == role_code))
        assert role is not None

        assigned_permission_codes = {
            assignment.permission.code
            for assignment in session.scalars(select(RolePermission).where(RolePermission.role_id == role.id))
        }

        assert assigned_permission_codes == all_permission_codes


def test_customer_role_has_no_admin_permissions(session: Session) -> None:
    seed_roles_and_permissions(session)

    customer = session.scalar(select(Role).where(Role.code == "customer"))
    assert customer is not None

    assert (
        session.query(RolePermission)
        .filter(RolePermission.role_id == customer.id)
        .count()
        == 0
    )
