"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  archiveAdminProduct,
  fetchAdminProducts,
  publishAdminProduct,
  type AdminPaginationMeta,
  type AdminProduct,
} from "lib/admin";

type ProductsState =
  | { status: "loading"; products: []; meta: null; error: null }
  | { status: "ready"; products: AdminProduct[]; meta: AdminPaginationMeta; error: null }
  | { status: "error"; products: []; meta: null; error: string };

const pageSize = 20;

export function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [productsState, setProductsState] = useState<ProductsState>({
    status: "loading",
    products: [],
    meta: null,
    error: null,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setProductsState({ status: "loading", products: [], meta: null, error: null });

    fetchAdminProducts({ page, pageSize })
      .then((result) => {
        if (isMounted) {
          setProductsState({ status: "ready", products: result.data, meta: result.meta, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load products.";
          setProductsState({ status: "error", products: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  async function handleStatusAction(product: AdminProduct) {
    setActionError(null);

    try {
      const updatedProduct =
        product.status === "active"
          ? await archiveAdminProduct(product.id)
          : await publishAdminProduct(product.id);

      if (productsState.status === "ready") {
        setProductsState({
          status: "ready",
          meta: productsState.meta,
          error: null,
          products: productsState.products.map((item) =>
            item.id === updatedProduct.id ? updatedProduct : item
          ),
        });
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Product action failed.";
      setActionError(message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Catalog
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">Products</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Manage product records through backend admin catalog APIs.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={[
            "inline-flex h-fit justify-center rounded-full bg-stone-950 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
          ].join(" ")}
        >
          Create Product
        </Link>
      </section>

      {actionError ? <StatePanel message={actionError} tone="error" /> : null}
      {productsState.status === "loading" ? <StatePanel message="Loading products..." /> : null}
      {productsState.status === "error" ? <StatePanel message={productsState.error} tone="error" /> : null}

      {productsState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {productsState.products.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No products found.</div>
            ) : (
              productsState.products.map((product) => (
                <ProductRow
                  key={product.id}
                  onStatusAction={handleStatusAction}
                  product={product}
                />
              ))
            )}
          </section>
          <PaginationControls meta={productsState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function ProductRow({
  onStatusAction,
  product,
}: {
  onStatusAction: (product: AdminProduct) => void;
  product: AdminProduct;
}) {
  const statusActionLabel = product.status === "active" ? "Archive" : "Publish";

  return (
    <article className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-stone-950">{product.name}</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
            {product.status}
          </span>
          {product.is_featured ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
              Featured
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-stone-600">/{product.slug}</p>
        <p className="mt-2 text-sm text-stone-600">
          SKU {product.sku ?? "Not set"} / {formatPriceRange(product)}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-center text-sm text-stone-700"
          href={`/admin/products/${product.id}/edit`}
        >
          Edit
        </Link>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
          onClick={() => onStatusAction(product)}
          type="button"
        >
          {statusActionLabel}
        </button>
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
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} products
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

function formatPriceRange(product: AdminProduct): string {
  if (product.min_price === null && product.max_price === null) {
    return "Price not set";
  }

  if (product.min_price === product.max_price || product.max_price === null) {
    return formatMoney(product.min_price ?? "0", product.currency_code);
  }

  return `${formatMoney(product.min_price ?? "0", product.currency_code)} - ${formatMoney(
    product.max_price,
    product.currency_code
  )}`;
}

function formatMoney(value: string, currencyCode: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
