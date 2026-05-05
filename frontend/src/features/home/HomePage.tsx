"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

import { products } from "features/products/product-data";

const categories: Array<{ titleKey: TranslationKey; descriptionKey: TranslationKey }> = [
  {
    titleKey: "home.dailyTitle",
    descriptionKey: "home.dailyDescription",
  },
  {
    titleKey: "home.clinicalTitle",
    descriptionKey: "home.clinicalDescription",
  },
  {
    titleKey: "home.seasonalTitle",
    descriptionKey: "home.seasonalDescription",
  },
];

const highlights: Array<{
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}> = [
  {
    eyebrowKey: "home.featuredEyebrow",
    titleKey: "home.featuredTitle",
    descriptionKey: "home.featuredDescription",
  },
  {
    eyebrowKey: "home.editorialEyebrow",
    titleKey: "home.editorialTitle",
    descriptionKey: "home.editorialDescription",
  },
  {
    eyebrowKey: "home.launchEyebrow",
    titleKey: "home.launchTitle",
    descriptionKey: "home.launchDescription",
  },
];

const homepageProducts = [
  ...products.filter((product) => product.categorySlug === "oncology-prescription"),
  ...products.filter((product) => product.categorySlug !== "oncology-prescription"),
].slice(0, 6);

export function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 md:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
            {t("home.kicker")}
          </p>
          <h1 className="max-w-4xl text-5xl leading-tight text-emerald-950 md:text-7xl">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-emerald-900/75">{t("home.description")}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
            >
              {t("home.browseCatalog")}
            </Link>
            <Link
              href="/blog"
              className="rounded-full border border-emerald-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800"
            >
              {t("home.readGuidance")}
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,253,245,0.92))] p-8 shadow-[0_32px_80px_rgba(6,78,59,0.10)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
            {t("home.signals")}
          </p>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="text-sm font-medium text-emerald-700">{t("home.renderingModel")}</dt>
              <dd className="mt-2 text-2xl text-emerald-950">{t("home.renderingValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-emerald-700">{t("home.commerceAuthority")}</dt>
              <dd className="mt-2 text-2xl text-emerald-950">{t("home.commerceValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-emerald-700">{t("home.layoutRole")}</dt>
              <dd className="mt-2 text-2xl text-emerald-950">{t("home.layoutValue")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              {t("home.categoryHighlights")}
            </p>
            <h2 className="text-3xl text-emerald-950 md:text-4xl">{t("home.categoryTitle")}</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-emerald-900/75">{t("home.categoryDescription")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.titleKey}
              className="rounded-[1.75rem] border border-emerald-100 bg-white/85 p-7 shadow-[0_18px_50px_rgba(6,78,59,0.07)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                {t("home.categoryLabel")}
              </p>
              <h3 className="mt-5 text-2xl text-emerald-950">{t(category.titleKey)}</h3>
              <p className="mt-4 text-sm leading-7 text-emerald-900/75">{t(category.descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-emerald-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              {t("home.productListEyebrow")}
            </p>
            <h2 className="text-3xl text-emerald-950 md:text-4xl">{t("home.productListTitle")}</h2>
          </div>
          <div className="max-w-xl space-y-4">
            <p className="text-sm leading-7 text-emerald-900/75">{t("home.productListDescription")}</p>
            <Link
              href="/products"
              className="inline-flex rounded-full border border-emerald-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 hover:border-emerald-950 hover:text-emerald-950"
            >
              {t("home.viewAllProducts")}
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {homepageProducts.map((product) => (
            <article
              key={product.slug}
              className="flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-white/90 shadow-[0_18px_50px_rgba(6,78,59,0.07)]"
            >
              <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${product.imageTone}`} aria-hidden={!product.imageAlt}>
                {product.imagePath ? (
                  <Image
                    src={product.imagePath}
                    alt={product.imageAlt ?? product.name}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                      {product.badge}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      {product.brand}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl leading-tight text-emerald-950">{product.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-emerald-900/75">{product.summary}</p>
                </div>
                <Link
                  href={`/products/${product.slug}`}
                  className="mt-8 w-fit rounded-full bg-emerald-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-emerald-800"
                >
                  {t("products.viewProduct")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.titleKey}
            className="rounded-[1.75rem] border border-emerald-100 bg-emerald-950 p-7 text-emerald-50"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-300">
              {t(highlight.eyebrowKey)}
            </p>
            <h2 className="mt-5 text-2xl leading-tight">{t(highlight.titleKey)}</h2>
            <p className="mt-4 text-sm leading-7 text-emerald-100">{t(highlight.descriptionKey)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
