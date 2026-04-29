import Link from "next/link";

import { ContentBlocks } from "features/content/ContentBlocks";
import type { PaginatedPublicPosts, PublicPostDetail, PublicPostListItem } from "lib/cms";

type BlogListingPageProps = {
  errorMessage?: string;
  posts: PaginatedPublicPosts;
};

type BlogDetailPageProps = {
  post: PublicPostDetail;
};

export function BlogListingPage({ errorMessage, posts }: BlogListingPageProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[0.85fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
            Journal
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-tight text-stone-950 md:text-6xl">
            Practical health and pharmacy notes.
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
          Published editorial posts from the CMS, rendered as indexable storefront content and kept separate from
          commerce business rules.
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-2xl text-stone-950">Posts are temporarily unavailable.</h2>
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
          <h2 className="text-2xl text-stone-950">No posts are published yet.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            The blog will show entries after content editors publish posts in the CMS.
          </p>
        </section>
      )}

      <p className="text-sm text-stone-500">
        Showing {posts.data.length} of {posts.meta.total} published posts.
      </p>
    </div>
  );
}

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/blog" className="hover:text-stone-950">
          Journal
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{post.title}</span>
      </nav>

      <header className="space-y-6 border-b border-stone-200 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Journal
          </span>
          <time className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500" dateTime={post.published_at}>
            {formatDate(post.published_at)}
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
  return (
    <article className="flex min-h-80 flex-col justify-between rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]">
      <div>
        <time className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500" dateTime={post.published_at}>
          {formatDate(post.published_at)}
        </time>
        <h2 className="mt-6 text-2xl leading-tight text-stone-950">{post.title}</h2>
        {post.summary ? <p className="mt-4 text-sm leading-7 text-stone-600">{post.summary}</p> : null}
      </div>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-8 w-fit rounded-full bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
      >
        Read Post
      </Link>
    </article>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
