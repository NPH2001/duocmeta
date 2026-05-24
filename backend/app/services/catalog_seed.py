from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Brand, Category, MediaFile, Product, ProductCategory, ProductImage, ProductVariant


@dataclass(frozen=True)
class CatalogProductSeed:
    name: str
    slug: str
    sku: str
    brand_slug: str
    category_slug: str
    short_description: str
    description: str
    product_type: str
    media_folder: str
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
    (
        "Immunology Reference",
        "immunology-reference",
        "Editorial reference brand for Lupus treatment product information.",
    ),
    (
        "Biologic Therapy Reference",
        "biologic-therapy-reference",
        "Editorial reference brand for specialist biologic therapy entries.",
    ),
)

CATEGORY_SEEDS: tuple[tuple[str, str, str, int], ...] = (
    (
        "Thuốc điều trị Lupus",
        "thuoc-dieu-tri-lupus",
        "Danh mục thuốc điều trị Lupus được hiển thị như hồ sơ kê đơn/tham khảo và luôn cần xác nhận chuyên môn trước khi sử dụng.",
        10,
    ),
    (
        "Thuốc điều trị ung thư",
        "thuoc-dieu-tri-ung-thu",
        "Danh mục thuốc điều trị ung thư chỉ hiển thị nội dung tham khảo/kê đơn, ưu tiên cảnh báo an toàn và yêu cầu bác sĩ hoặc dược sĩ chuyên khoa xác nhận.",
        20,
    ),
)

LEGACY_CATEGORY_SLUGS: tuple[str, ...] = ("oncology-prescription",)

CATALOG_PRODUCT_SEEDS: tuple[CatalogProductSeed, ...] = (
    CatalogProductSeed(
        name="Hydroxychloroquine",
        slug="hydroxychloroquine-lupus",
        sku="RX-LUPUS-HCQ",
        brand_slug="immunology-reference",
        category_slug="thuoc-dieu-tri-lupus",
        short_description="Prescription reference listing for a Lupus treatment medicine that requires specialist review.",
        description=(
            "Hydroxychloroquine appears in this catalog as a Lupus-treatment reference entry. Indication, pricing, "
            "stock, dispensing, and safe-use decisions must be confirmed by licensed clinicians or specialist pharmacists."
        ),
        product_type="prescription_reference",
        media_folder="lupus",
        media_filename="hydroxychloroquine.svg",
        media_alt_text="Illustrative card for Hydroxychloroquine Lupus treatment information",
        variant_sku="RX-LUPUS-HCQ-INFO",
    ),
    CatalogProductSeed(
        name="Belimumab",
        slug="belimumab-lupus",
        sku="RX-LUPUS-BELIMUMAB",
        brand_slug="biologic-therapy-reference",
        category_slug="thuoc-dieu-tri-lupus",
        short_description="Biologic Lupus treatment reference with specialist-only storefront messaging.",
        description=(
            "Belimumab is represented as a specialist Lupus therapy entry. This storefront content is informational "
            "only and must not replace clinical assessment, infusion planning, or pharmacist counselling."
        ),
        product_type="prescription_reference",
        media_folder="lupus",
        media_filename="belimumab.svg",
        media_alt_text="Illustrative card for Belimumab Lupus biologic therapy information",
        variant_sku="RX-LUPUS-BELIMUMAB-INFO",
    ),
    CatalogProductSeed(
        name="Mycophenolate mofetil",
        slug="mycophenolate-mofetil-lupus",
        sku="RX-LUPUS-MMF",
        brand_slug="immunology-reference",
        category_slug="thuoc-dieu-tri-lupus",
        short_description="Immunosuppressive Lupus treatment reference requiring laboratory follow-up and clinician oversight.",
        description=(
            "Mycophenolate mofetil is listed as a Lupus-treatment reference medicine. The storefront does not make "
            "treatment decisions; prescribing, monitoring, and dispensing must remain under professional supervision."
        ),
        product_type="prescription_reference",
        media_folder="lupus",
        media_filename="mycophenolate-mofetil.svg",
        media_alt_text="Illustrative card for Mycophenolate mofetil Lupus treatment information",
        variant_sku="RX-LUPUS-MMF-INFO",
    ),
    CatalogProductSeed(
        name="Prednisone",
        slug="prednisone-lupus",
        sku="RX-LUPUS-PREDNISONE",
        brand_slug="immunology-reference",
        category_slug="thuoc-dieu-tri-lupus",
        short_description="Corticosteroid Lupus treatment reference that requires specialist dosing and taper guidance.",
        description=(
            "Prednisone is included as a reference entry for Lupus treatment discussions. Dose changes, tapering, "
            "co-medication review, and dispensing decisions must be confirmed by the treating clinician."
        ),
        product_type="prescription_reference",
        media_folder="lupus",
        media_filename="prednisone.svg",
        media_alt_text="Illustrative card for Prednisone Lupus treatment information",
        variant_sku="RX-LUPUS-PREDNISONE-INFO",
    ),
    CatalogProductSeed(
        name="Keytruda (pembrolizumab)",
        slug="keytruda-pembrolizumab",
        sku="RX-ONC-KEYTRUDA",
        brand_slug="merck-sharp-dohme",
        category_slug="thuoc-dieu-tri-ung-thu",
        short_description=(
            "Prescription immune checkpoint inhibitor information listing for specialist oncology review."
        ),
        description=(
            "Keytruda is the brand name for pembrolizumab, an anti-PD-1 monoclonal antibody and immune "
            "checkpoint inhibitor. This catalog entry is informational only: indication, eligibility, pricing, "
            "stock, and dispensing must be confirmed by licensed clinicians or pharmacists."
        ),
        product_type="prescription_reference",
        media_folder="oncology",
        media_filename="keytruda-pembrolizumab.svg",
        media_alt_text="Illustrative vial for Keytruda pembrolizumab prescription information",
        variant_sku="RX-ONC-KEYTRUDA-INFO",
    ),
    CatalogProductSeed(
        name="Nitrosoureas",
        slug="nitrosoureas-oncology-class",
        sku="RX-ONC-NITROSOUREAS",
        brand_slug="oncology-reference",
        category_slug="thuoc-dieu-tri-ung-thu",
        short_description="Oncology drug-class reference for anticancer medicines requiring specialist supervision.",
        description=(
            "Nitrosoureas are anticancer medicines that can cross the blood-brain barrier; carmustine "
            "and lomustine are examples. This entry is a drug-class reference, not a self-medication product."
        ),
        product_type="drug_class_reference",
        media_folder="oncology",
        media_filename="nitrosoureas.svg",
        media_alt_text="Illustrative pharmacy card for nitrosoureas oncology drug class",
        variant_sku="RX-ONC-NITROSOUREAS-INFO",
    ),
    CatalogProductSeed(
        name="Anthracyclines",
        slug="anthracyclines-oncology-class",
        sku="RX-ONC-ANTHRACYCLINES",
        brand_slug="oncology-reference",
        category_slug="thuoc-dieu-tri-ung-thu",
        short_description="Anthracycline chemotherapy class reference with prescription-only storefront messaging.",
        description=(
            "Anthracyclines are oncology medicines associated with agents such as doxorubicin and "
            "amrubicin. These entries require professional treatment decisions and safety monitoring."
        ),
        product_type="drug_class_reference",
        media_folder="oncology",
        media_filename="anthracyclines.svg",
        media_alt_text="Illustrative healthcare card for anthracyclines oncology drug class",
        variant_sku="RX-ONC-ANTHRACYCLINES-INFO",
    ),
    CatalogProductSeed(
        name="Topoisomerase inhibitors",
        slug="topoisomerase-inhibitors-oncology-class",
        sku="RX-ONC-TOPOISOMERASE",
        brand_slug="oncology-reference",
        category_slug="thuoc-dieu-tri-ung-thu",
        short_description="DNA-targeted oncology drug-class reference requiring clinician review.",
        description=(
            "Topoisomerase inhibitors block enzymes needed for DNA strands to break and rejoin during "
            "cell growth. This catalog item is a professional reference and not treatment guidance."
        ),
        product_type="drug_class_reference",
        media_folder="oncology",
        media_filename="topoisomerase-inhibitors.svg",
        media_alt_text="Illustrative DNA card for topoisomerase inhibitors oncology drug class",
        variant_sku="RX-ONC-TOPOISOMERASE-INFO",
    ),
)


def seed_oncology_catalog(session: Session) -> None:
    """Backward-compatible entrypoint for the specialty treatment catalog seed."""
    brands = _upsert_brands(session)
    categories = _upsert_categories(session)
    now = datetime.now(UTC)

    for product_seed in CATALOG_PRODUCT_SEEDS:
        product = _upsert_product(session, product_seed, brands[product_seed.brand_slug], now)
        _ensure_category_links(session, product, categories[product_seed.category_slug])
        media = _upsert_media(session, product_seed)
        _ensure_primary_image(session, product, media)
        _upsert_reference_variant(session, product, product_seed)

    _delete_legacy_categories(session)
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


def _upsert_categories(session: Session) -> dict[str, Category]:
    categories_by_slug = {category.slug: category for category in session.scalars(select(Category)).all()}

    for name, slug, description, sort_order in CATEGORY_SEEDS:
        category = categories_by_slug.get(slug)
        if category is None:
            category = Category(name=name, slug=slug)
            session.add(category)
            categories_by_slug[slug] = category

        category.name = name
        category.description = description
        category.sort_order = sort_order
        category.is_active = True

    session.flush()
    return categories_by_slug


def _upsert_product(session: Session, product_seed: CatalogProductSeed, brand: Brand, now: datetime) -> Product:
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


def _ensure_category_links(session: Session, product: Product, category: Category) -> None:
    links = session.scalars(select(ProductCategory).where(ProductCategory.product_id == product.id)).all()

    link = None
    for existing in links:
        if existing.category_id == category.id:
            link = existing
        else:
            session.delete(existing)

    if link is None:
        link = ProductCategory(product_id=product.id, category_id=category.id)
        session.add(link)

    link.is_primary = True
    session.flush()


def _delete_legacy_categories(session: Session) -> None:
    for slug in LEGACY_CATEGORY_SLUGS:
        category = session.scalar(select(Category).where(Category.slug == slug))
        if category is not None:
            session.delete(category)

    session.flush()


def _upsert_media(session: Session, product_seed: CatalogProductSeed) -> MediaFile:
    storage_key = f"products/{product_seed.media_folder}/{product_seed.media_filename}"
    media = session.scalar(select(MediaFile).where(MediaFile.storage_key == storage_key))

    if media is None:
        media = MediaFile(storage_key=storage_key, filename=product_seed.media_filename, mime_type="image/svg+xml", size_bytes=0)
        session.add(media)

    media.filename = product_seed.media_filename
    media.mime_type = "image/svg+xml"
    media.size_bytes = _asset_size(product_seed.media_folder, product_seed.media_filename)
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


def _upsert_reference_variant(session: Session, product: Product, product_seed: CatalogProductSeed) -> None:
    variant = session.scalar(select(ProductVariant).where(ProductVariant.sku == product_seed.variant_sku))

    if variant is None:
        variant = ProductVariant(product_id=product.id, sku=product_seed.variant_sku, price=0)
        session.add(variant)

    variant.product_id = product.id
    variant.status = "draft"
    product.default_variant_id = None
    session.flush()


def _asset_size(folder: str, filename: str) -> int:
    asset_path = Path(__file__).resolve().parents[3] / "frontend" / "public" / "products" / folder / filename
    if asset_path.exists():
        return asset_path.stat().st_size
    return 1
