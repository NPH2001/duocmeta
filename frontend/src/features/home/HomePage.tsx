"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

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

export function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 md:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
            {t("home.kicker")}
          </p>
          <h1 className="max-w-4xl text-5xl leading-tight text-stone-950 md:text-7xl">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-600">{t("home.description")}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
            >
              {t("home.browseCatalog")}
            </Link>
            <Link
              href="/blog"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              {t("home.readGuidance")}
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,238,226,0.92))] p-8 shadow-[0_32px_80px_rgba(28,25,23,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
            {t("home.signals")}
          </p>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="text-sm font-medium text-stone-500">{t("home.renderingModel")}</dt>
              <dd className="mt-2 text-2xl text-stone-950">{t("home.renderingValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-stone-500">{t("home.commerceAuthority")}</dt>
              <dd className="mt-2 text-2xl text-stone-950">{t("home.commerceValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-stone-500">{t("home.layoutRole")}</dt>
              <dd className="mt-2 text-2xl text-stone-950">{t("home.layoutValue")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              {t("home.categoryHighlights")}
            </p>
            <h2 className="text-3xl text-stone-950 md:text-4xl">{t("home.categoryTitle")}</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-stone-600">{t("home.categoryDescription")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.titleKey}
              className="rounded-[1.75rem] border border-stone-200 bg-white/85 p-7 shadow-[0_18px_50px_rgba(28,25,23,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                {t("home.categoryLabel")}
              </p>
              <h3 className="mt-5 text-2xl text-stone-950">{t(category.titleKey)}</h3>
              <p className="mt-4 text-sm leading-7 text-stone-600">{t(category.descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.titleKey}
            className="rounded-[1.75rem] border border-stone-200 bg-stone-950 p-7 text-stone-100"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
              {t(highlight.eyebrowKey)}
            </p>
            <h2 className="mt-5 text-2xl leading-tight">{t(highlight.titleKey)}</h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">{t(highlight.descriptionKey)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
