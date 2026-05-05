from app.core.db import SessionLocal
from app.services.catalog_seed import seed_oncology_catalog


def main() -> None:
    with SessionLocal() as session:
        seed_oncology_catalog(session)


if __name__ == "__main__":
    main()
