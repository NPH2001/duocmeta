import Link from "next/link";

import { ContentBlocks } from "features/content/ContentBlocks";
import type { PublicPageDetail } from "lib/cms";

type ContentPageProps = {
  page: PublicPageDetail;
};

export function ContentPage({ page }: ContentPageProps) {
  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          Home
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{page.title}</span>
      </nav>

      <header className="space-y-5 border-b border-stone-200 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
          Page
        </p>
        <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">{page.title}</h1>
        <time className="block text-sm text-stone-500" dateTime={page.published_at}>
          Published {formatDate(page.published_at)}
        </time>
      </header>

      <div className="max-w-none space-y-6 text-base leading-8 text-stone-700">
        <ContentBlocks content={page.content} />
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
