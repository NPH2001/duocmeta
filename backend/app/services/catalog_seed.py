from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Brand, Category, MediaFile, Product, ProductCategory, ProductImage, ProductVariant


@dataclass(frozen=True)
class OncologyProductSeed:
    name: str
    slug: str
    sku: str
    brand_slug: str
    short_description: str
    description: str
    product_type: str
    media_filename: str
    media_alt_text: str
    variant_sku: str


BRAND_SEEDS: tuple[tuple[str, str, str], ...] = (
    (
        "Merck Sharp & Dohme",
        "merck-sharp-dohme",
        "Manufacturer reference brand for prescription oncology product information.",
    ),
    (
        "Oncology Reference",
        "oncology-reference",
        "Editorial reference brand for oncology drug-class catalog entries.",
    ),
)

ONCOLOGY_CATEGORY = (
    "Oncology Prescription",
    "oncology-prescription",
    "Prescription oncology medicines and drug-class references that require specialist consultation before use.",
)

ONCOLOGY_PRODUCT_SEEDS: tuple[OncologyProductSeed, ...] = (
    OncologyProductSeed(
        name="Keytruda (pembrolizumab)",
        slug="keytruda-pembrolizumab",
        sku="RX-ONC-KEYTRUDA",
        brand_slug="merck-sharp-dohme",
        short_description=(
            "Prescription immune checkpoint inhibitor information listing for specialist oncology review."
        ),
        description=(
            "Keytruda is the brand name for pembrolizumab, an anti-PD-1 monoclonal antibody and immune "
            "checkpoint inhibitor. This catalog entry is informational only: indication, eligibility, pricing, "
            "stock, and dispensing must be confirmed by licensed clinicians or pharmacists."
        ),
        product_type="prescription_reference",
        media_filename="keytruda-pembrolizumab.svg",
        media_alt_text="Illustrative vial for Keytruda pembrolizumab prescription information",
        variant_sku="RX-ONC-KEYTRUDA-INFO",
    ),
    OncologyProductSeed(
        name="Nitrosoureas",
        slug="nitrosoureas-oncology-class",
        sku="RX-ONC-NITROSOUREAS",
        brand_slug="oncology-reference",
        short_description="Oncology drug-class reference for anticancer medicines requiring specialist supervision.",
        description=(
            "Nitrosoureas are anticancer medicines that can cross the blood-brain barrier; carmustine "
            "and lomustine are examples. This entry is a drug-class reference, not a self-medication product."
        ),
        product_type="drug_class_reference",
        media_filename="nitrosoureas.svg",
        media_alt_text="Illustrative pharmacy card for nitrosoureas oncology drug class",
        variant_sku="RX-ONC-NITROSOUREAS-INFO",
    ),
    OncologyProductSeed(
        name="Anthracyclines",
        slug="anthracyclines-oncology-class",
        sku="RX-ONC-ANTHRACYCLINES",
        brand_slug="oncology-reference",
        short_description="Anthracycline chemotherapy class reference with prescription-only storefront messaging.",
        description=(
            "Anthracyclines are oncology medicines associated with agents such as doxorubicin and "
            "amrubicin. These entries require professional treatment decisions and safety monitoring."
        ),
        product_type="drug_class_reference",
        media_filename="anthracyclines.svg",
        media_alt_text="Illustrative healthcare card for anthracyclines oncology drug class",
        variant_sku="RX-ONC-ANTHRACYCLINES-INFO",
    ),
    OncologyProductSeed(
        name="Topoisomerase inhibitors",
        slug="topoisomerase-inhibitors-oncology-class",
        sku="RX-ONC-TOPOISOMERASE",
        brand_slug="oncology-reference",
        short_description="DNA-targeted oncology drug-class reference requiring clinician review.",
        description=(
            "Topoisomerase inhibitors block enzymes needed for DNA strands to break and rejoin during "
            "cell growth. This catalog item is a professional reference and not treatment guidance."
        ),
        product_type="drug_class_reference",
        media_filename="topoisomerase-inhibitors.svg",
        media_alt_text="Illustrative DNA card for topoisomerase inhibitors oncology drug class",
        variant_sku="RX-ONC-TOPOISOMERASE-INFO",
    ),
)


def seed_oncology_catalog(session: Session) -> None:
    brands = _upsert_brands(session)
    category = _upsert_oncology_category(session)
    now = datetime.now(UTC)

    for product_seed in ONCOLOGY_PRODUCT_SEEDS:
        product = _upsert_product(session, product_seed, brands[product_seed.brand_slug], now)
        _ensure_primary_category(session, product, category)
        media = _upsert_media(session, product_seed)
        _ensure_primary_image(session, product, media)
        _upsert_reference_variant(session, product, product_seed)

    session.commit()


def _upsert_brands(session: Session) -> dict[str, Brand]:
    brands_by_slug = {brand.slug: brand for brand in session.scalars(select(Brand)).all()}

    for name, slug, description in BRAND_SEEDS:
        brand = brands_by_slug.get(slug)
        if brand is None:
            brand = Brand(name=name, slug=slug)
            session.add(brand)
            brands_by_slug[slug] = brand

        brand.name = name
        brand.description = description
        brand.is_active = True

    session.flush()
    return brands_by_slug


def _upsert_oncology_category(session: Session) -> Category:
    name, slug, description = ONCOLOGY_CATEGORY
    category = session.scalar(select(Category).where(Category.slug == slug))

    if category is None:
        category = Category(name=name, slug=slug)
        session.add(category)

    category.name = name
    category.description = description
    category.sort_order = 40
    category.is_active = True
    session.flush()
    return category


def _upsert_product(session: Session, product_seed: OncologyProductSeed, brand: Brand, now: datetime) -> Product:
    product = session.scalar(select(Product).where(Product.slug == product_seed.slug, Product.deleted_at.is_(None)))

    if product is None:
        product = Product(slug=product_seed.slug)
        session.add(product)

    product.brand_id = brand.id
    product.name = product_seed.name
    product.sku = product_seed.sku
    product.short_description = product_seed.short_description
    product.description = product_seed.description
    product.status = "active"
    product.product_type = product_seed.product_type
    product.is_featured = True
    product.currency_code = "VND"
    product.min_price = None
    product.max_price = None
    product.published_at = product.published_at or now
    product.deleted_at = None
    session.flush()
    return product


def _ensure_primary_category(session: Session, product: Product, category: Category) -> None:
    link = session.scalar(
        select(ProductCategory).where(
            ProductCategory.product_id == product.id,
            ProductCategory.category_id == category.id,
        )
    )

    if link is None:
        link = ProductCategory(product_id=product.id, category_id=category.id)
        session.add(link)

    link.is_primary = True
    session.flush()


def _upsert_media(session: Session, product_seed: OncologyProductSeed) -> MediaFile:
    storage_key = f"products/oncology/{product_seed.media_filename}"
    media = session.scalar(select(MediaFile).where(MediaFile.storage_key == storage_key))

    if media is None:
        media = MediaFile(storage_key=storage_key, filename=product_seed.media_filename, mime_type="image/svg+xml", size_bytes=0)
        session.add(media)

    media.filename = product_seed.media_filename
    media.mime_type = "image/svg+xml"
    media.size_bytes = _asset_size(product_seed.media_filename)
    media.width = 960
    media.height = 540
    media.alt_text = product_seed.media_alt_text
    session.flush()
    return media


def _ensure_primary_image(session: Session, product: Product, media: MediaFile) -> None:
    image = session.scalar(
        select(ProductImage).where(
            ProductImage.product_id == product.id,
            ProductImage.media_id == media.id,
            ProductImage.variant_id.is_(None),
        )
    )

    if image is None:
        image = ProductImage(product_id=product.id, media_id=media.id)
        session.add(image)

    image.sort_order = 1
    image.is_primary = True
    session.flush()


def _upsert_reference_variant(session: Session, product: Product, product_seed: OncologyProductSeed) -> None:
    variant = session.scalar(select(ProductVariant).where(ProductVariant.sku == product_seed.variant_sku))

    if variant is None:
        variant = ProductVariant(product_id=product.id, sku=product_seed.variant_sku, price=0)
        session.add(variant)

    variant.product_id = product.id
    variant.status = "draft"
    product.default_variant_id = None
    session.flush()


def _asset_size(filename: str) -> int:
    asset_path = Path(__file__).resolve().parents[3] / "frontend" / "public" / "products" / "oncology" / filename
    if asset_path.exists():
        return asset_path.stat().st_size
    return 1
