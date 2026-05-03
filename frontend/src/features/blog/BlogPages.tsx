"use client";

import Link from "next/link";

import { ContentBlocks } from "features/content/ContentBlocks";
import { useLanguage } from "features/i18n/LanguageProvider";
import type { PaginatedPublicPosts, PublicPostDetail, PublicPostListItem } from "lib/cms";

type BlogListingPageProps = {
  errorMessage?: string;
  posts: PaginatedPublicPosts;
};

type BlogDetailPageProps = {
  post: PublicPostDetail;
};

export function BlogListingPage({ errorMessage, posts }: BlogListingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[0.85fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
            {t("blog.kicker")}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-tight text-stone-950 md:text-6xl">
            {t("blog.title")}
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
          {t("blog.description")}
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-2xl text-stone-950">{t("blog.unavailableTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">{errorMessage}</p>
        </section>
      ) : posts.data.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white/90 p-8">
          <h2 className="text-2xl text-stone-950">{t("blog.emptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            {t("blog.emptyDescription")}
          </p>
        </section>
      )}

      <p className="text-sm text-stone-500">
        {t("blog.showingPrefix")} {posts.data.length} {t("blog.showingMiddle")} {posts.meta.total} {t("blog.showingSuffix")}
      </p>
    </div>
  );
}

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  const { t, locale } = useLanguage();

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <Link href="/blog" className="hover:text-stone-950">
          {t("blog.kicker")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{post.title}</span>
      </nav>

      <header className="space-y-6 border-b border-stone-200 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {t("blog.kicker")}
          </span>
          <time className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500" dateTime={post.published_at}>
            {formatDate(post.published_at, locale)}
          </time>
        </div>
        <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">{post.title}</h1>
        {post.summary ? <p className="max-w-3xl text-lg leading-8 text-stone-600">{post.summary}</p> : null}
      </header>

      <div className="max-w-none space-y-6 text-base leading-8 text-stone-700">
        <ContentBlocks content={post.content} />
      </div>
    </article>
  );
}

function PostCard({ post }: { post: PublicPostListItem }) {
  const { t, locale } = useLanguage();

  return (
    <article className="flex min-h-80 flex-col justify-between rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]">
      <div>
        <time className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500" dateTime={post.published_at}>
          {formatDate(post.published_at, locale)}
        </time>
        <h2 className="mt-6 text-2xl leading-tight text-stone-950">{post.title}</h2>
        {post.summary ? <p className="mt-4 text-sm leading-7 text-stone-600">{post.summary}</p> : null}
      </div>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-8 w-fit rounded-full bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
      >
        {t("blog.readPost")}
      </Link>
    </article>
  );
}

export function formatDate(value: string, locale: "en" | "vi" = "en") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
