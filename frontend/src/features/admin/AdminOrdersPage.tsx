"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminOrders,
  type AdminOrderListItem,
  type AdminPaginationMeta,
} from "lib/admin";

type OrdersState =
  | { status: "loading"; orders: []; meta: null; error: null }
  | { status: "ready"; orders: AdminOrderListItem[]; meta: AdminPaginationMeta; error: null }
  | { status: "error"; orders: []; meta: null; error: string };

const pageSize = 20;

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [ordersState, setOrdersState] = useState<OrdersState>({
    status: "loading",
    orders: [],
    meta: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    setOrdersState({ status: "loading", orders: [], meta: null, error: null });

    fetchAdminOrders({ page, pageSize })
      .then((result) => {
        if (isMounted) {
          setOrdersState({ status: "ready", orders: result.data, meta: result.meta, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load orders.";
          setOrdersState({ status: "error", orders: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Operations
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-stone-950">Orders</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Review customer orders and run workflow actions through backend admin order APIs.
        </p>
      </section>

      {ordersState.status === "loading" ? <StatePanel message="Loading orders..." /> : null}
      {ordersState.status === "error" ? <StatePanel message={ordersState.error} tone="error" /> : null}

      {ordersState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {ordersState.orders.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No orders found.</div>
            ) : (
              ordersState.orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </section>
          <PaginationControls meta={ordersState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrderListItem }) {
  return (
    <Link
      className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]"
      href={`/admin/orders/${order.order_code}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-stone-950">{order.order_code}</h2>
          <StatusBadge value={order.status} />
        </div>
        <p className="mt-2 text-sm text-stone-600">
          Payment {order.payment_status} / Fulfillment {order.fulfillment_status}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {formatOptionalDate(order.placed_at ?? order.created_at)}
        </p>
      </div>
      <p className="text-lg text-stone-950 xl:text-right">
        {formatMoney(order.grand_total_amount, order.currency_code)}
      </p>
    </Link>
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
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} orders
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

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
      {value}
    </span>
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
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: string, currencyCode: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
