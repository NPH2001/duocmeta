from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.identity import Permission, Role, RolePermission


@dataclass(frozen=True)
class RoleSeed:
    code: str
    name: str
    description: str


@dataclass(frozen=True)
class PermissionSeed:
    code: str
    name: str
    description: str


PERMISSIONS: tuple[PermissionSeed, ...] = (
    PermissionSeed("manage_users", "Manage users", "Create, update, and disable user accounts."),
    PermissionSeed("manage_roles", "Manage roles", "Manage roles and permission assignments."),
    PermissionSeed("manage_products", "Manage products", "Manage product catalog records."),
    PermissionSeed("manage_inventory", "Manage inventory", "Adjust inventory and stock records."),
    PermissionSeed("manage_orders", "Manage orders", "Process and update customer orders."),
    PermissionSeed("manage_coupons", "Manage coupons", "Create and update coupon campaigns."),
    PermissionSeed("manage_pages", "Manage pages", "Manage CMS pages."),
    PermissionSeed("manage_posts", "Manage posts", "Manage blog posts and editorial content."),
    PermissionSeed("manage_seo", "Manage SEO", "Manage SEO metadata and redirects."),
    PermissionSeed("manage_media", "Manage media", "Manage media library assets."),
    PermissionSeed("manage_redirects", "Manage redirects", "Manage public redirect rules."),
    PermissionSeed("manage_settings", "Manage settings", "Manage system settings."),
    PermissionSeed("view_audit_logs", "View audit logs", "View administrative audit logs."),
)

ROLES: tuple[RoleSeed, ...] = (
    RoleSeed("customer", "Customer", "Authenticated storefront customer."),
    RoleSeed("support", "Support", "Support operator with order and audit visibility."),
    RoleSeed("content_editor", "Content Editor", "Editorial user for CMS content."),
    RoleSeed("catalog_manager", "Catalog Manager", "Catalog operator for products, media, and inventory."),
    RoleSeed("order_manager", "Order Manager", "Order operator for fulfillment workflows."),
    RoleSeed("marketing_manager", "Marketing Manager", "Marketing operator for coupons and SEO surfaces."),
    RoleSeed("admin", "Admin", "Administrator with full operational permissions."),
    RoleSeed("super_admin", "Super Admin", "Highest privilege administrator."),
)

ALL_PERMISSION_CODES = tuple(permission.code for permission in PERMISSIONS)

ROLE_PERMISSION_CODES: dict[str, tuple[str, ...]] = {
    "customer": (),
    "support": ("manage_orders", "view_audit_logs"),
    "content_editor": ("manage_pages", "manage_posts", "manage_media", "manage_seo"),
    "catalog_manager": ("manage_products", "manage_inventory", "manage_media", "manage_seo"),
    "order_manager": ("manage_orders", "view_audit_logs"),
    "marketing_manager": ("manage_coupons", "manage_seo", "manage_redirects", "manage_pages", "manage_posts"),
    "admin": ALL_PERMISSION_CODES,
    "super_admin": ALL_PERMISSION_CODES,
}


def seed_roles_and_permissions(session: Session) -> None:
    permissions_by_code = _upsert_permissions(session)
    roles_by_code = _upsert_roles(session)
    _sync_role_permissions(session, roles_by_code, permissions_by_code)
    session.commit()


def _upsert_permissions(session: Session) -> dict[str, Permission]:
    existing_permissions = session.scalars(select(Permission)).all()
    permissions_by_code = {permission.code: permission for permission in existing_permissions}

    for permission_seed in PERMISSIONS:
        permission = permissions_by_code.get(permission_seed.code)

        if permission is None:
            permission = Permission(code=permission_seed.code, name=permission_seed.name)
            session.add(permission)
            permissions_by_code[permission_seed.code] = permission

        permission.name = permission_seed.name
        permission.description = permission_seed.description

    session.flush()
    return permissions_by_code


def _upsert_roles(session: Session) -> dict[str, Role]:
    existing_roles = session.scalars(select(Role)).all()
    roles_by_code = {role.code: role for role in existing_roles}

    for role_seed in ROLES:
        role = roles_by_code.get(role_seed.code)

        if role is None:
            role = Role(code=role_seed.code, name=role_seed.name)
            session.add(role)
            roles_by_code[role_seed.code] = role

        role.name = role_seed.name
        role.description = role_seed.description

    session.flush()
    return roles_by_code


def _sync_role_permissions(
    session: Session,
    roles_by_code: dict[str, Role],
    permissions_by_code: dict[str, Permission],
) -> None:
    existing_assignments = {
        (assignment.role_id, assignment.permission_id)
        for assignment in session.scalars(select(RolePermission)).all()
    }

    for role_code, permission_codes in ROLE_PERMISSION_CODES.items():
        role = roles_by_code[role_code]

        for permission_code in permission_codes:
            permission = permissions_by_code[permission_code]
            assignment_key = (role.id, permission.id)

            if assignment_key in existing_assignments:
                continue

            session.add(RolePermission(role_id=role.id, permission_id=permission.id))
            existing_assignments.add(assignment_key)
