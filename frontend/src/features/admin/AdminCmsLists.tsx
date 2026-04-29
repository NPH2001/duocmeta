"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminPages,
  fetchAdminPosts,
  fetchAdminRedirects,
  fetchAdminSeoMetadataList,
  type AdminPage,
  type AdminPaginationMeta,
  type AdminPost,
  type AdminRedirect,
  type AdminSeoMetadata,
} from "lib/admin";

const pageSize = 20;

type ResourceKind = "pages" | "posts" | "redirects" | "seo";
type ResourceItem = AdminPage | AdminPost | AdminRedirect | AdminSeoMetadata;
type ResourceState =
  | { status: "loading"; items: []; meta: null; error: null }
  | { status: "ready"; items: ResourceItem[]; meta: AdminPaginationMeta; error: null }
  | { status: "error"; items: []; meta: null; error: string };

const resourceConfig = {
  pages: {
    eyebrow: "CMS",
    title: "Pages",
    description: "Create and update CMS pages through backend admin APIs.",
    createHref: "/admin/cms/pages/new",
    createLabel: "Create Page",
  },
  posts: {
    eyebrow: "Editorial",
    title: "Posts",
    description: "Manage editorial posts and publication state through backend admin APIs.",
    createHref: "/admin/cms/posts/new",
    createLabel: "Create Post",
  },
  seo: {
    eyebrow: "SEO",
    title: "SEO metadata",
    description: "Maintain backend-owned metadata records for indexable entities.",
    createHref: "/admin/cms/seo/new",
    createLabel: "Create Metadata",
  },
  redirects: {
    eyebrow: "SEO",
    title: "Redirects",
    description: "Manage public redirect rules through backend admin APIs.",
    createHref: "/admin/cms/redirects/new",
    createLabel: "Create Redirect",
  },
} satisfies Record<ResourceKind, { eyebrow: string; title: string; description: string; createHref: string; createLabel: string }>;

export function AdminCmsListPage({ kind }: { kind: ResourceKind }) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState<ResourceState>({ status: "loading", items: [], meta: null, error: null });
  const config = resourceConfig[kind];

  useEffect(() => {
    let isMounted = true;
    setState({ status: "loading", items: [], meta: null, error: null });

    fetchResource(kind, page)
      .then((result) => {
        if (isMounted) {
          setState({ status: "ready", items: result.data, meta: result.meta, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : `Could not load ${config.title}.`;
          setState({ status: "error", items: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [config.title, kind, page]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{config.eyebrow}</p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">{config.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">{config.description}</p>
        </div>
        <Link
          className="inline-flex h-fit justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white"
          href={config.createHref}
        >
          {config.createLabel}
        </Link>
      </section>

      {state.status === "loading" ? <StatePanel message={`Loading ${config.title.toLowerCase()}...`} /> : null}
      {state.status === "error" ? <StatePanel message={state.error} tone="error" /> : null}
      {state.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {state.items.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No records found.</div>
            ) : (
              state.items.map((item) => <ResourceRow item={item} kind={kind} key={item.id} />)
            )}
          </section>
          <PaginationControls meta={state.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function ResourceRow({ item, kind }: { item: ResourceItem; kind: ResourceKind }) {
  const title = "title" in item ? item.title : "from_path" in item ? item.from_path : `${item.entity_type}:${item.entity_id}`;
  const subtitle =
    "slug" in item ? `/${item.slug}` : "to_path" in item ? item.to_path : item.meta_title ?? "Metadata";
  const status = "status" in item ? item.status : "is_active" in item ? (item.is_active ? "active" : "inactive") : item.robots ?? "seo";

  return (
    <article className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="break-words text-xl text-stone-950">{title}</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
            {status}
          </span>
        </div>
        <p className="mt-2 break-words text-sm text-stone-600">{subtitle}</p>
        {"published_at" in item ? (
          <p className="mt-2 text-sm text-stone-600">Published {formatOptionalDate(item.published_at)}</p>
        ) : null}
      </div>
      <Link
        className="h-fit rounded-full border border-stone-300 px-4 py-2 text-center text-sm text-stone-700"
        href={`/admin/cms/${kind}/${item.id}/edit`}
      >
        Edit
      </Link>
    </article>
  );
}

async function fetchResource(kind: ResourceKind, page: number) {
  switch (kind) {
    case "pages":
      return fetchAdminPages({ page, pageSize });
    case "posts":
      return fetchAdminPosts({ page, pageSize });
    case "seo":
      return fetchAdminSeoMetadataList({ page, pageSize });
    case "redirects":
      return fetchAdminRedirects({ page, pageSize });
  }
}

function PaginationControls({ meta, onPageChange }: { meta: AdminPaginationMeta; onPageChange: (page: number) => void }) {
  const canGoBack = meta.page > 1;
  const canGoForward = meta.total_pages > 0 && meta.page < meta.total_pages;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-stone-600">
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} records
      </p>
      <div className="flex gap-3">
        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400" disabled={!canGoBack} onClick={() => onPageChange(meta.page - 1)} type="button">
          Previous
        </button>
        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400" disabled={!canGoForward} onClick={() => onPageChange(meta.page + 1)} type="button">
          Next
        </button>
      </div>
    </div>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : "rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600";

  return <div className={className}>{message}</div>;
}

function formatOptionalDate(value: string | null): string {
  if (!value) {
    return "not set";
  }

  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}
