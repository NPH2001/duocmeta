"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

import type { Category } from "./category-data";

type CategoryListingPageProps = {
  category: Category;
};

const sortOptions: TranslationKey[] = [
  "categories.sortFeatured",
  "categories.sortNewest",
  "categories.sortName",
  "categories.sortPrice",
];

export function CategoryListingPage({ category }: CategoryListingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <Link href="/categories" className="hover:text-stone-950">
          {t("nav.categories")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{category.name}</span>
      </nav>

      <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
            {t("categories.kicker")}
          </p>
          <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">
            {category.name}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
            {category.description}
          </p>
        </div>

        <dl className="grid gap-4 rounded-2xl border border-stone-200 bg-white/88 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {t("categories.catalogStatus")}
            </dt>
            <dd className="mt-2 text-2xl text-stone-950">SSR / ISR ready</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {t("categories.productsIndexed")}
            </dt>
            <dd className="mt-2 text-2xl text-stone-950">{category.productCount}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white/88 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              {t("categories.filters")}
            </h2>
            <div className="mt-5 grid gap-3">
              {category.filters.map((filter) => (
                <label key={filter} className="flex items-center gap-3 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-stone-300 accent-emerald-700"
                  />
                  {filter}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white/88 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              {t("categories.priceAuthority")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              {t("categories.backendNotice")}
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-stone-600">
              {t("categories.showingPrefix")} {category.products.length} {t("categories.showingSuffix")}
            </p>
            <label className="flex items-center gap-3 text-sm text-stone-600">
              {t("categories.sort")}
              <select className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900">
                {sortOptions.map((option) => (
                  <option key={option}>{t(option)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {category.products.map((product) => (
              <article
                key={product.slug}
                className="flex min-h-80 flex-col justify-between rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                      {product.badge}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                      {product.brand}
                    </span>
                  </div>
                  <h2 className="mt-8 text-2xl leading-tight text-stone-950">{product.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{product.summary}</p>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-stone-100 pt-5">
                  <span className="text-sm font-semibold text-stone-950">{product.priceLabel}</span>
                  <Link
                    href={`/products/${product.slug}`}
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 hover:border-stone-950 hover:text-stone-950"
                  >
                    {t("categories.view")}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <nav
            aria-label={t("categories.pagination")}
            className="flex items-center justify-between border-t border-stone-200 pt-6"
          >
            <span className="text-sm text-stone-500">{t("categories.pageOne")}</span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-400"
              >
                {t("categories.previous")}
              </button>
              <button
                type="button"
                disabled
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-400"
              >
                {t("categories.next")}
              </button>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
