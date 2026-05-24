"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  archiveAdminProduct,
  buildAdminMediaUrl,
  deleteAdminProduct,
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
          const message = caughtError instanceof Error ? caughtError.message : "Không thể tải danh sách sản phẩm.";
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
      const message = caughtError instanceof Error ? caughtError.message : "Thao tác sản phẩm thất bại.";
      setActionError(message);
    }
  }

  async function handleDeleteAction(product: AdminProduct) {
    setActionError(null);

    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    try {
      await deleteAdminProduct(product.id);

      if (productsState.status === "ready") {
        const remainingProducts = productsState.products.filter((item) => item.id !== product.id);
        const nextTotal = Math.max(0, productsState.meta.total - 1);
        const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / pageSize);

        setProductsState({
          status: "ready",
          error: null,
          meta: {
            ...productsState.meta,
            total: nextTotal,
            total_pages: nextTotalPages,
          },
          products: remainingProducts,
        });
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Xóa sản phẩm thất bại.";
      setActionError(message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Danh mục sản phẩm
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-emerald-950">Sản phẩm</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900/75">
            Quản lý hồ sơ sản phẩm qua API quản trị của hệ thống.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={[
            "inline-flex h-fit justify-center rounded-full bg-emerald-600 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500",
          ].join(" ")}
        >
          Thêm sản phẩm
        </Link>
      </section>

      {actionError ? <StatePanel message={actionError} tone="error" /> : null}
      {productsState.status === "loading" ? <StatePanel message="Đang tải sản phẩm..." /> : null}
      {productsState.status === "error" ? <StatePanel message={productsState.error} tone="error" /> : null}

      {productsState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
            {productsState.products.length === 0 ? (
              <div className="p-6 text-sm text-emerald-900/75">Chưa có sản phẩm.</div>
            ) : (
              productsState.products.map((product) => (
                <ProductRow
                  key={product.id}
                  onDeleteAction={handleDeleteAction}
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
  onDeleteAction,
  onStatusAction,
  product,
}: {
  onDeleteAction: (product: AdminProduct) => void;
  onStatusAction: (product: AdminProduct) => void;
  product: AdminProduct;
}) {
  const statusActionLabel = product.status === "active" ? "Lưu trữ" : "Đăng bán";
  const primaryImage = product.images.find((image) => image.is_primary && image.variant_id === null) ?? null;

  return (
    <article className="grid gap-4 border-b border-emerald-50 p-5 last:border-b-0 xl:grid-cols-[104px_1fr_auto]">
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
        {primaryImage ? (
          <div className="relative aspect-square w-full">
            <Image
              alt={primaryImage.media.alt_text ?? product.name}
              className="object-cover"
              fill
              sizes="104px"
              src={buildAdminMediaUrl(primaryImage.media.storage_key)}
              unoptimized
            />
          </div>
        ) : (
          <div className="grid aspect-square w-full place-items-center text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Chưa có ảnh
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-emerald-950">{product.name}</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
            {product.status}
          </span>
          {product.is_featured ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
              Nổi bật
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-emerald-900/75">/{product.slug}</p>
        <p className="mt-2 text-sm text-emerald-900/75">
          SKU {product.sku ?? "Chưa thiết lập"} / {formatPriceRange(product)}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
        <Link
          className="rounded-full border border-emerald-300 px-4 py-2 text-center text-sm text-emerald-800"
          href={`/admin/products/${product.id}/edit`}
        >
          Sửa
        </Link>
        <button
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800"
          onClick={() => onStatusAction(product)}
          type="button"
        >
          {statusActionLabel}
        </button>
        <button
          className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700"
          onClick={() => onDeleteAction(product)}
          type="button"
        >
          Xóa
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
        "flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4",
        "sm:flex-row sm:justify-between",
      ].join(" ")}
    >
      <p className="text-sm text-emerald-900/75">
        Trang {meta.page} / {meta.total_pages || 1} · {meta.total} sản phẩm
      </p>
      <div className="flex gap-3">
        <button
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800 disabled:text-emerald-600"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
          type="button"
        >
          Trước
        </button>
        <button
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800 disabled:text-emerald-600"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
          type="button"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";

  return <div className={className}>{message}</div>;
}

function formatPriceRange(product: AdminProduct): string {
  if (product.min_price === null && product.max_price === null) {
    return "Giá chưa thiết lập";
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
