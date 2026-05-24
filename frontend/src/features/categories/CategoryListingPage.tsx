"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import { buildPublicMediaUrl, type CatalogPaginationMeta, type PublicCategoryDetail, type PublicProductListItem } from "lib/catalog";
import type { TranslationKey } from "lib/i18n";

type CategoryListingPageProps = {
  category: PublicCategoryDetail;
  products: PublicProductListItem[];
  productsMeta: CatalogPaginationMeta;
};

const sortOptions: TranslationKey[] = [
  "categories.sortFeatured",
  "categories.sortNewest",
  "categories.sortName",
  "categories.sortPrice",
];

export function CategoryListingPage({ category, products, productsMeta }: CategoryListingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-emerald-700">
        <Link href="/" className="hover:text-emerald-950">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <Link href="/categories" className="hover:text-emerald-950">
          {t("nav.categories")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-emerald-950">{category.name}</span>
      </nav>

      <section className="grid gap-8 border-b border-emerald-100 pb-10 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">{t("categories.kicker")}</p>
          <h1 className="max-w-4xl text-4xl leading-tight text-emerald-950 md:text-6xl">{category.name}</h1>
        </div>

        <dl className="grid gap-4 rounded-2xl border border-emerald-100 bg-white/88 p-6 shadow-[0_18px_50px_rgba(6,78,59,0.07)]">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("categories.catalogStatus")}</dt>
            <dd className="mt-2 text-2xl text-emerald-950">SSR / ISR ready</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("categories.productsIndexed")}</dt>
            <dd className="mt-2 text-2xl text-emerald-950">{productsMeta.total}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white/88 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{t("categories.filters")}</h2>
            <div className="mt-5 grid gap-3">
              {category.children.length > 0 ? (
                category.children.map((child) => (
                  <Link key={child.id} href={`/categories/${child.slug}`} className="text-sm text-emerald-800 hover:text-emerald-950">
                    • {child.name}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-emerald-900/75">Chưa có danh mục con công khai.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-emerald-100 pb-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-emerald-900/75">
              {t("categories.showingPrefix")} {products.length} {t("categories.showingSuffix")}
            </p>
            <label className="flex items-center gap-3 text-sm text-emerald-900/75">
              {t("categories.sort")}
              <select className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm text-emerald-950" defaultValue={t("categories.sortNewest")}>
                {sortOptions.map((option) => (
                  <option key={option}>{t(option)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.length > 0 ? (
              products.map((product) => (
                <article
                  key={product.slug}
                  className="flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-white/90 shadow-[0_18px_50px_rgba(6,78,59,0.07)]"
                >
                  <Link href={`/products/${product.slug}`} className="relative block h-48 overflow-hidden bg-emerald-50">
                    {product.primary_image ? (
                      <Image
                        alt={product.primary_image.alt_text ?? product.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
                        src={buildPublicMediaUrl(product.primary_image.storage_key)}
            unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-lime-50 to-white" />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                      {product.is_featured ? "Nổi bật" : "Catalog"}
                    </span>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{product.currency_code}</span>
                    </div>
                    <h2 className="mt-6 text-2xl leading-tight text-emerald-950">{product.name}</h2>
                    <p className="mt-4 text-sm leading-7 text-emerald-900/75">
                      {product.short_description ?? "Sản phẩm đang được lấy trực tiếp từ public catalog API."}
                    </p>
                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-emerald-50 pt-5">
                      <span className="text-sm font-semibold text-emerald-950">{formatPriceRange(product)}</span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 hover:border-emerald-950 hover:text-emerald-950"
                      >
                        {t("categories.view")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 text-sm text-emerald-900/75">
                Chưa có sản phẩm công khai trong danh mục này.
              </div>
            )}
          </div>

          <nav aria-label={t("categories.pagination")} className="flex items-center justify-between border-t border-emerald-100 pt-6">
            <span className="text-sm text-emerald-700">
              Trang {productsMeta.page} / {productsMeta.total_pages || 1}
            </span>
            <div className="flex gap-3">
              <button type="button" disabled className="rounded-full border border-emerald-100 px-4 py-2 text-sm text-emerald-600">
                {t("categories.previous")}
              </button>
              <button type="button" disabled className="rounded-full border border-emerald-100 px-4 py-2 text-sm text-emerald-600">
                {t("categories.next")}
              </button>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}

function formatPriceRange(product: Pick<PublicProductListItem, "currency_code" | "min_price" | "max_price">) {
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
