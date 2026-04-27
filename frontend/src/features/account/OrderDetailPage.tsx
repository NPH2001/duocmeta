"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clearAccessToken, readStoredAccessToken } from "lib/auth";
import {
  cancelCustomerOrder,
  fetchCustomerOrder,
  type CustomerOrderDetail,
  type CustomerOrderItem,
} from "lib/orders";

type OrderDetailState =
  | { status: "loading"; order: null; error: null }
  | { status: "guest"; order: null; error: string }
  | { status: "ready"; order: CustomerOrderDetail; error: null }
  | { status: "error"; order: null; error: string };

export function OrderDetailPage({ orderCode }: { orderCode: string }) {
  const [detailState, setDetailState] = useState<OrderDetailState>({
    status: "loading",
    order: null,
    error: null,
  });
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const accessToken = readStoredAccessToken();

    if (!accessToken) {
      setDetailState({
        status: "guest",
        order: null,
        error: "Login is required to view order details.",
      });
      return;
    }

    setDetailState({ status: "loading", order: null, error: null });
    setCancelError(null);

    fetchCustomerOrder(orderCode)
      .then((order) => {
        if (isMounted) {
          setDetailState({ status: "ready", order, error: null });
        }
      })
      .catch((caughtError) => {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : "Could not load order.";
        if (message.toLowerCase().includes("access token")) {
          clearAccessToken();
          setDetailState({
            status: "guest",
            order: null,
            error: "Login is required to view order details.",
          });
          return;
        }

        setDetailState({ status: "error", order: null, error: message });
      });

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  async function handleCancel() {
    if (detailState.status !== "ready") {
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const order = await cancelCustomerOrder(detailState.order.order_code);
      setDetailState({ status: "ready", order, error: null });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not cancel order.";
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:py-14">
      <section className="grid gap-5 border-b border-stone-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Order</p>
          <h1 className="mt-3 break-words text-4xl leading-tight text-stone-950 md:text-5xl">
            {orderCode}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            This page renders the backend order snapshot, including item prices, totals, and statuses.
          </p>
        </div>
        <Link
          href="/account/orders"
          className={[
            "inline-flex justify-center rounded-full border border-stone-300 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-stone-700",
            "hover:border-stone-950 hover:text-stone-950",
          ].join(" ")}
        >
          Order History
        </Link>
      </section>

      {detailState.status === "loading" ? <StatePanel message="Loading order..." /> : null}

      {detailState.status === "guest" ? (
        <GuestPanel message={detailState.error} />
      ) : null}

      {detailState.status === "error" ? <StatePanel message={detailState.error} tone="error" /> : null}

      {detailState.status === "ready" ? (
        <OrderDetail
          cancelError={cancelError}
          isCancelling={isCancelling}
          onCancel={handleCancel}
          order={detailState.order}
        />
      ) : null}
    </div>
  );
}

function OrderDetail({
  cancelError,
  isCancelling,
  onCancel,
  order,
}: {
  cancelError: string | null;
  isCancelling: boolean;
  onCancel: () => void;
  order: CustomerOrderDetail;
}) {
  const canRequestCancel =
    ["pending_payment", "awaiting_confirmation"].includes(order.status) &&
    order.payment_status === "pending";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white/88">
        <div className="border-b border-stone-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Items
          </p>
          <h2 className="mt-2 text-2xl text-stone-950">Purchase snapshot</h2>
        </div>
        {order.items.map((item) => (
          <OrderItemRow
            currencyCode={order.currency_code}
            item={item}
            key={item.id}
          />
        ))}
      </section>

      <aside className="flex flex-col gap-5">
        <StatusCard order={order} />
        <TotalsCard order={order} />
        <TimelineCard order={order} />

        {canRequestCancel ? (
          <section className="rounded-2xl border border-stone-200 bg-white/88 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Cancellation
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Pending orders can be cancelled before payment confirmation or fulfillment starts.
            </p>
            {cancelError ? <p className="mt-3 text-sm text-red-700">{cancelError}</p> : null}
            <button
              className={[
                "mt-5 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold",
                "uppercase tracking-[0.16em] text-white hover:bg-stone-800 disabled:bg-stone-400",
              ].join(" ")}
              disabled={isCancelling}
              onClick={onCancel}
              type="button"
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function OrderItemRow({
  currencyCode,
  item,
}: {
  currencyCode: string;
  item: CustomerOrderItem;
}) {
  return (
    <div className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 md:grid-cols-[1fr_auto]">
      <div>
        <h3 className="text-lg text-stone-950">{item.product_name}</h3>
        <p className="mt-2 text-sm text-stone-600">
          {item.variant_name ?? "Default variant"} / SKU {item.sku}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {item.quantity} x {formatMoney(item.unit_price, currencyCode)}
        </p>
      </div>
      <p className="text-lg text-stone-950 md:text-right">
        {formatMoney(item.line_total_amount, currencyCode)}
      </p>
    </div>
  );
}

function StatusCard({ order }: { order: CustomerOrderDetail }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-950 p-5 text-stone-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Status
      </p>
      <div className="mt-5 grid gap-3">
        <StatusLine label="Order" tone="dark" value={order.status} />
        <StatusLine label="Payment" tone="dark" value={order.payment_status} />
        <StatusLine label="Fulfillment" tone="dark" value={order.fulfillment_status} />
      </div>
    </section>
  );
}

function TotalsCard({ order }: { order: CustomerOrderDetail }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/88 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Totals
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <TotalLine label="Subtotal" value={formatMoney(order.subtotal_amount, order.currency_code)} />
        <TotalLine label="Discount" value={formatMoney(order.discount_amount, order.currency_code)} />
        <TotalLine label="Shipping" value={formatMoney(order.shipping_amount, order.currency_code)} />
        <TotalLine label="Tax" value={formatMoney(order.tax_amount, order.currency_code)} />
        <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Total
          </span>
          <span className="text-xl text-stone-950">
            {formatMoney(order.grand_total_amount, order.currency_code)}
          </span>
        </div>
      </div>
    </section>
  );
}

function TimelineCard({ order }: { order: CustomerOrderDetail }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/88 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Timeline
      </p>
      <div className="mt-5 grid gap-3">
        <StatusLine label="Created" value={formatDate(order.created_at)} />
        <StatusLine label="Placed" value={formatOptionalDate(order.placed_at)} />
        <StatusLine label="Completed" value={formatOptionalDate(order.completed_at)} />
        <StatusLine label="Cancelled" value={formatOptionalDate(order.cancelled_at)} />
      </div>
    </section>
  );
}

function GuestPanel({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
      <h2 className="text-2xl text-stone-950">Login required</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">{message}</p>
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
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-800"
      : "rounded-2xl border border-stone-200 bg-white/80 p-8 text-sm text-stone-600";

  return <div className={className}>{message}</div>;
}

function StatusLine({
  label,
  tone = "light",
  value,
}: {
  label: string;
  tone?: "light" | "dark";
  value: string;
}) {
  const labelClassName = tone === "dark" ? "text-stone-400" : "text-stone-500";
  const valueClassName = tone === "dark" ? "text-stone-50" : "text-stone-950";

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={labelClassName}>{label}</span>
      <span className={`text-right font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-950">{value}</span>
    </div>
  );
}

function formatOptionalDate(value: string | null): string {
  return value ? formatDate(value) : "Not set";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: string, currencyCode: string): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
