"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  fetchAdminProducts,
  fetchAdminVariants,
  type AdminPaginationMeta,
  type AdminProduct,
  type AdminVariant,
} from "lib/admin";

type VariantsState =
  | { status: "loading"; variants: []; products: []; meta: null; error: null }
  | {
      status: "ready";
      variants: AdminVariant[];
      products: AdminProduct[];
      meta: AdminPaginationMeta;
      error: null;
    }
  | { status: "error"; variants: []; products: []; meta: null; error: string };

const pageSize = 20;

export function AdminVariantsPage() {
  const [page, setPage] = useState(1);
  const [variantsState, setVariantsState] = useState<VariantsState>({
    status: "loading",
    variants: [],
    products: [],
    meta: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    setVariantsState({ status: "loading", variants: [], products: [], meta: null, error: null });

    Promise.all([
      fetchAdminVariants({ page, pageSize }),
      fetchAdminProducts({ page: 1, pageSize: 100 }),
    ])
      .then(([variantResult, productResult]) => {
        if (isMounted) {
          setVariantsState({
            status: "ready",
            variants: variantResult.data,
            products: productResult.data,
            meta: variantResult.meta,
            error: null,
          });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load variants.";
          setVariantsState({ status: "error", variants: [], products: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  const productsById = useMemo(() => {
    if (variantsState.status !== "ready") {
      return new Map<string, AdminProduct>();
    }

    return new Map(variantsState.products.map((product) => [product.id, product]));
  }, [variantsState]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Catalog
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">Variants</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Manage variant records and prepare stock adjustments through backend-owned inventory flows.
          </p>
        </div>
        <Link
          href="/admin/variants/new"
          className={[
            "inline-flex h-fit justify-center rounded-full bg-stone-950 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
          ].join(" ")}
        >
          Create Variant
        </Link>
      </section>

      {variantsState.status === "loading" ? <StatePanel message="Loading variants..." /> : null}
      {variantsState.status === "error" ? <StatePanel message={variantsState.error} tone="error" /> : null}

      {variantsState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {variantsState.variants.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No variants found.</div>
            ) : (
              variantsState.variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  product={productsById.get(variant.product_id) ?? null}
                  variant={variant}
                />
              ))
            )}
          </section>
          <PaginationControls meta={variantsState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function VariantRow({
  product,
  variant,
}: {
  product: AdminProduct | null;
  variant: AdminVariant;
}) {
  return (
    <article className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-stone-950">{variant.sku}</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
            {variant.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-600">{product?.name ?? "Product not loaded"}</p>
        <p className="mt-2 text-sm text-stone-600">
          Price {formatMoney(variant.price)} / Cost {formatOptionalMoney(variant.cost_price)}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-center text-sm text-stone-700"
          href={`/admin/variants/${variant.id}/edit`}
        >
          Edit
        </Link>
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-center text-sm text-stone-700"
          href={`/admin/variants/${variant.id}/inventory`}
        >
          Inventory
        </Link>
      </div>
    </article>
  );
}

function PaginationControls({
  meta,
  onPageChange,
}: {
  meta: AdminPaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const canGoBack = meta.page > 1;
  const canGoForward = meta.total_pages > 0 && meta.page < meta.total_pages;

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4",
        "sm:flex-row sm:justify-between",
      ].join(" ")}
    >
      <p className="text-sm text-stone-600">
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} variants
      </p>
      <div className="flex gap-3">
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
          type="button"
        >
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

function formatOptionalMoney(value: string | null): string {
  return value ? formatMoney(value) : "Not set";
}

function formatMoney(value: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
