"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";

import type { ProductDetail } from "./product-data";

type ProductDetailPageProps = {
  product: ProductDetail;
};

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { t } = useLanguage();

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
        <span className="px-2">/</span>
        <Link href={`/categories/${product.categorySlug}`} className="hover:text-emerald-950">
          {product.categoryName}
        </Link>
        <span className="px-2">/</span>
        <span className="text-emerald-950">{product.name}</span>
      </nav>

      <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <div
            className={`relative flex aspect-[4/3] items-end overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br ${product.imageTone} p-7 shadow-[0_28px_70px_rgba(6,78,59,0.10)]`}
            aria-label={`${product.name} ${t("products.imagePlaceholderSuffix")}`}
          >
            {product.imagePath ? (
              <Image
                src={product.imagePath}
                alt={product.imageAlt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            ) : null}
            <div className="relative z-10 w-full rounded-2xl border border-white/80 bg-white/75 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                {t("products.gallery")}
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl leading-tight text-emerald-950 md:text-6xl">
                {product.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {product.highlights.map((highlight) => (
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
                {product.badge}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {product.brand}
              </span>
            </div>
            <h2 className="text-3xl leading-tight text-emerald-950">{product.name}</h2>
            <p className="text-base leading-8 text-emerald-900/75">{product.description}</p>
          </div>

          <div className="border-y border-emerald-100 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {t("products.price")}
            </p>
            <p className="mt-3 text-2xl text-emerald-950">{product.priceLabel === "Backend priced" ? t("products.backendPriced") : product.priceLabel}</p>
            <p className="mt-3 text-sm leading-6 text-emerald-900/75">
              {t("products.priceNotice")}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {t("products.variants")}
            </h3>
            <div className="grid gap-3">
              {product.variants.map((variant) => (
                <label
                  key={variant.id}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="variant"
                      defaultChecked={variant === product.variants[0]}
                      className="h-4 w-4 accent-emerald-700"
                    />
                    <span>
                      <span className="block font-medium text-emerald-950">{variant.label}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                        {variant.sku}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium text-emerald-950">{variant.priceLabel === "Backend priced" ? t("products.backendPriced") : variant.priceLabel}</span>
                    <span className="text-xs text-emerald-700">{variant.statusLabel === "API pending" ? t("products.apiPending") : variant.statusLabel}</span>
                  </span>
                </label>
              ))}
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
              href={`/categories/${product.categorySlug}`}
              className="rounded-full border border-emerald-300 px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800 hover:border-emerald-950 hover:text-emerald-950"
            >
              {t("products.backToCategory")}
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white/88 p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            {t("products.productInformation")}
          </p>
          <h2 className="mt-5 text-3xl text-emerald-950">{t("products.structuredDetail")}</h2>
          <p className="mt-4 text-sm leading-7 text-emerald-900/75">{product.summary}</p>
          <p className="mt-4 text-sm leading-7 text-emerald-900/75">
            {t("products.contentOnly")}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-emerald-950 p-6 text-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            {t("products.backendAuthority")}
          </p>
          <h2 className="mt-5 text-2xl leading-tight">{t("products.noFrontendRules")}</h2>
          <p className="mt-4 text-sm leading-7 text-emerald-100">
            {t("products.disabledCartNotice")}
          </p>
        </article>
      </section>
    </div>
  );
}
