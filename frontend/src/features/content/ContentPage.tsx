"use client";

import Link from "next/link";

import { ContentBlocks } from "features/content/ContentBlocks";
import { useLanguage } from "features/i18n/LanguageProvider";
import type { PublicPageDetail } from "lib/cms";

type ContentPageProps = {
  page: PublicPageDetail;
};

export function ContentPage({ page }: ContentPageProps) {
  const { t, locale } = useLanguage();

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{page.title}</span>
      </nav>

      <header className="space-y-5 border-b border-stone-200 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
          {t("content.page")}
        </p>
        <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">{page.title}</h1>
        <time className="block text-sm text-stone-500" dateTime={page.published_at}>
          {t("content.published")} {formatDate(page.published_at, locale)}
        </time>
      </header>

      <div className="max-w-none space-y-6 text-base leading-8 text-stone-700">
        <ContentBlocks content={page.content} />
      </div>
    </article>
  );
}

function formatDate(value: string, locale: "en" | "vi" = "en") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
