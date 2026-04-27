from app.core.db import SessionLocal
from app.services.identity_seed import seed_roles_and_permissions


def main() -> None:
    with SessionLocal() as session:
        seed_roles_and_permissions(session)


if __name__ == "__main__":
    main()
