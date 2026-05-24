"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import { buildPublicMediaUrl, type PublicProductDetail, type PublicProductVariant } from "lib/catalog";

type ProductDetailPageProps = {
  product: PublicProductDetail;
};

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { t } = useLanguage();
  const primaryCategory = product.categories[0] ?? null;
  const primaryImage = product.images.find((image) => image.is_primary && image.variant_id === null) ?? product.images[0] ?? null;
  const primaryDescription = product.description ?? product.short_description ?? "Nội dung sản phẩm đang được đồng bộ từ backend catalog.";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-emerald-700">
        <Link href="/" className="hover:text-emerald-950">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <Link href="/products" className="hover:text-emerald-950">
          {t("nav.products")}
        </Link>
        {primaryCategory ? (
          <>
            <span className="px-2">/</span>
            <Link href={`/categories/${primaryCategory.slug}`} className="hover:text-emerald-950">
              {primaryCategory.name}
            </Link>
          </>
        ) : null}
        <span className="px-2">/</span>
        <span className="text-emerald-950">{product.name}</span>
      </nav>

      <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <div
            className="relative flex aspect-[4/3] items-end overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-100 via-lime-50 to-white p-7 shadow-[0_28px_70px_rgba(6,78,59,0.10)]"
            aria-label={`${product.name} ${t("products.imagePlaceholderSuffix")}`}
          >
            {primaryImage ? (
              <Image
                src={buildPublicMediaUrl(primaryImage.storage_key)}
                unoptimized
                alt={primaryImage.alt_text ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            ) : null}
            <div className="relative z-10 w-full rounded-2xl border border-white/80 bg-white/75 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{t("products.gallery")}</p>
              <h1 className="mt-5 max-w-2xl text-4xl leading-tight text-emerald-950 md:text-6xl">{product.name}</h1>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {buildHighlights(product).map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-emerald-100 bg-white/88 p-4">
                <p className="text-sm font-medium text-emerald-900">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-8 rounded-3xl border border-emerald-100 bg-white/90 p-7 shadow-[0_22px_60px_rgba(6,78,59,0.08)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                {product.is_featured ? "Nổi bật" : product.product_type}
              </span>
              {product.brand ? (
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{product.brand.name}</span>
              ) : null}
            </div>
            <h2 className="text-3xl leading-tight text-emerald-950">{product.name}</h2>
            <p className="text-base leading-8 text-emerald-900/75">{primaryDescription}</p>
          </div>

          <div className="border-y border-emerald-100 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("products.price")}</p>
            <p className="mt-3 text-2xl text-emerald-950">{formatPriceRange(product)}</p>
            <p className="mt-3 text-sm leading-6 text-emerald-900/75">{t("products.priceNotice")}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("products.variants")}</h3>
            <div className="grid gap-3">
              {product.variants.length > 0 ? (
                product.variants.map((variant) => <VariantOption key={variant.id} variant={variant} defaultChecked={variant.id === product.default_variant_id || (product.default_variant_id === null && product.variants[0]?.id === variant.id)} />)
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                  Chưa có phiên bản công khai. Vui lòng liên hệ nhà thuốc để được tư vấn thêm.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled
              className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/75"
            >
              {t("products.addToCart")}
            </button>
            <Link
              href={primaryCategory ? `/categories/${primaryCategory.slug}` : "/products"}
              className="rounded-full border border-emerald-300 px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800 hover:border-emerald-950 hover:text-emerald-950"
            >
              {primaryCategory ? t("products.backToCategory") : t("nav.products")}
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white/88 p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("products.productInformation")}</p>
          <h2 className="mt-5 text-3xl text-emerald-950">{t("products.structuredDetail")}</h2>
          <p className="mt-4 text-sm leading-7 text-emerald-900/75">{product.short_description ?? primaryDescription}</p>
          <p className="mt-4 text-sm leading-7 text-emerald-900/75">{t("products.contentOnly")}</p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-emerald-700 p-6 text-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">{t("products.backendAuthority")}</p>
          <h2 className="mt-5 text-2xl leading-tight">{t("products.noFrontendRules")}</h2>
          <p className="mt-4 text-sm leading-7 text-emerald-100">{t("products.disabledCartNotice")}</p>
        </article>
      </section>
    </div>
  );
}

function VariantOption({ defaultChecked, variant }: { defaultChecked: boolean; variant: PublicProductVariant }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800">
      <span className="flex items-center gap-3">
        <input type="radio" name="variant" defaultChecked={defaultChecked} className="h-4 w-4 accent-emerald-700" />
        <span>
          <span className="block font-medium text-emerald-950">{formatVariantLabel(variant)}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-emerald-700">{variant.sku}</span>
        </span>
      </span>
      <span className="text-right">
        <span className="block font-medium text-emerald-950">{formatMoney(variant.price, "VND")}</span>
        <span className="text-xs text-emerald-700">Đang bán</span>
      </span>
    </label>
  );
}

function buildHighlights(product: PublicProductDetail) {
  const attributeHighlights = product.attributes.slice(0, 2).map((attribute) => attribute.name);
  const categoryHighlights = product.categories.slice(0, 2).map((category) => category.name);
  const highlights = [product.brand?.name, ...categoryHighlights, ...attributeHighlights].filter(Boolean) as string[];

  return highlights.length > 0 ? highlights.slice(0, 3) : ["Catalog backend", "Giá do backend quyết định", "Cần tư vấn khi cần"];
}

function formatVariantLabel(variant: PublicProductVariant) {
  const attributeSummary = variant.attributes.map((attribute) => attribute.display_value).join(" / ");
  return attributeSummary || "Phiên bản chuẩn";
}

function formatPriceRange(product: Pick<PublicProductDetail, "currency_code" | "min_price" | "max_price">) {
  if (product.min_price === null && product.max_price === null) {
    return "Liên hệ nhà thuốc";
  }

  if (product.min_price === product.max_price || product.max_price === null) {
    return formatMoney(product.min_price ?? "0", product.currency_code);
  }

  return `${formatMoney(product.min_price ?? "0", product.currency_code)} - ${formatMoney(product.max_price, product.currency_code)}`;
}

function formatMoney(value: string, currencyCode: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
