"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clearAccessToken, readStoredAccessToken } from "lib/auth";
import {
  fetchCustomerOrders,
  type CustomerOrderListItem,
  type PaginatedOrders,
} from "lib/orders";

type OrderHistoryState =
  | { status: "loading"; orders: []; meta: null; error: null }
  | { status: "guest"; orders: []; meta: null; error: string }
  | { status: "ready"; orders: CustomerOrderListItem[]; meta: PaginatedOrders["meta"]; error: null }
  | { status: "error"; orders: []; meta: null; error: string };

const pageSize = 10;

export function OrderHistoryPage() {
  const [page, setPage] = useState(1);
  const [historyState, setHistoryState] = useState<OrderHistoryState>({
    status: "loading",
    orders: [],
    meta: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const accessToken = readStoredAccessToken();

    if (!accessToken) {
      setHistoryState({
        status: "guest",
        orders: [],
        meta: null,
        error: "Login is required to view order history.",
      });
      return;
    }

    setHistoryState({ status: "loading", orders: [], meta: null, error: null });

    fetchCustomerOrders({ page, pageSize })
      .then((result) => {
        if (isMounted) {
          setHistoryState({ status: "ready", orders: result.data, meta: result.meta, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load orders.";
          if (message.toLowerCase().includes("access token")) {
            clearAccessToken();
            setHistoryState({
              status: "guest",
              orders: [],
              meta: null,
              error: "Login is required to view order history.",
            });
            return;
          }
          setHistoryState({ status: "error", orders: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:py-14">
      <section className="grid gap-5 border-b border-stone-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Orders</p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950 md:text-5xl">Order history</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            Orders are loaded from backend customer APIs and scoped to the authenticated account.
          </p>
        </div>
        <Link
          href="/account"
          className={[
            "inline-flex justify-center rounded-full border border-stone-300 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-stone-700",
            "hover:border-stone-950 hover:text-stone-950",
          ].join(" ")}
        >
          Account
        </Link>
      </section>

      {historyState.status === "loading" ? <StatePanel message="Loading orders..." /> : null}

      {historyState.status === "guest" ? (
        <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
          <h2 className="text-2xl text-stone-950">Login required</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">{historyState.error}</p>
          <Link
            href="/login"
            className={[
              "mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3",
              "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
            ].join(" ")}
          >
            Login
          </Link>
        </section>
      ) : null}

      {historyState.status === "error" ? <StatePanel message={historyState.error} tone="error" /> : null}

      {historyState.status === "ready" && historyState.orders.length === 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
          <h2 className="text-2xl text-stone-950">No orders yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
            Completed checkouts will appear here after backend order creation.
          </p>
          <Link
            href="/products"
            className={[
              "mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3",
              "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
            ].join(" ")}
          >
            Browse Products
          </Link>
        </section>
      ) : null}

      {historyState.status === "ready" && historyState.orders.length > 0 ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white/88">
            {historyState.orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </section>
          <PaginationControls meta={historyState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: CustomerOrderListItem }) {
  return (
    <Link
      href={`/account/orders/${order.order_code}`}
      className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 md:grid-cols-[1fr_auto]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {order.order_code}
        </p>
        <h2 className="mt-2 text-xl text-stone-950">{formatDate(order.placed_at ?? order.created_at)}</h2>
        <p className="mt-2 text-sm text-stone-600">
          Payment {order.payment_status} / Fulfillment {order.fulfillment_status}
        </p>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <span
          className={[
            "rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase",
            "tracking-[0.14em] text-stone-700",
          ].join(" ")}
        >
          {order.status}
        </span>
        <span className="text-lg text-stone-950">
          {formatMoney(order.grand_total_amount, order.currency_code)}
        </span>
      </div>
    </Link>
  );
}

function PaginationControls({
  meta,
  onPageChange,
}: {
  meta: PaginatedOrders["meta"];
  onPageChange: (page: number) => void;
}) {
  const canGoBack = meta.page > 1;
  const canGoForward = meta.total_pages > 0 && meta.page < meta.total_pages;

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white/88 p-4",
        "sm:flex-row sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <p className="text-sm text-stone-600">
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} orders
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400"
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
      ? "rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-800"
      : "rounded-2xl border border-stone-200 bg-white/80 p-8 text-sm text-stone-600";

  return <div className={className}>{message}</div>;
}

function formatDate(value: string): string {
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
