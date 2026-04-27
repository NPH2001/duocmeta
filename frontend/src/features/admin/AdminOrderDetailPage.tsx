"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminOrder,
  runAdminOrderWorkflow,
  type AdminOrderDetail,
  type AdminOrderItem,
} from "lib/admin";

type OrderDetailState =
  | { status: "loading"; order: null; error: null }
  | { status: "ready"; order: AdminOrderDetail; error: null }
  | { status: "error"; order: null; error: string };

type WorkflowAction = "cancel" | "confirm" | "deliver" | "refund" | "ship";

const workflowActions: { action: WorkflowAction; label: string }[] = [
  { action: "confirm", label: "Confirm" },
  { action: "ship", label: "Ship" },
  { action: "deliver", label: "Deliver" },
  { action: "cancel", label: "Cancel" },
  { action: "refund", label: "Refund" },
];

export function AdminOrderDetailPage({ orderCode }: { orderCode: string }) {
  const [detailState, setDetailState] = useState<OrderDetailState>({
    status: "loading",
    order: null,
    error: null,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);

  useEffect(() => {
    let isMounted = true;

    setDetailState({ status: "loading", order: null, error: null });
    setActionError(null);

    fetchAdminOrder(orderCode)
      .then((order) => {
        if (isMounted) {
          setDetailState({ status: "ready", order, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load order.";
          setDetailState({ status: "error", order: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  async function handleWorkflowAction(action: WorkflowAction) {
    if (detailState.status !== "ready") {
      return;
    }

    setActiveAction(action);
    setActionError(null);

    try {
      const order = await runAdminOrderWorkflow(detailState.order.order_code, action);
      setDetailState({ status: "ready", order, error: null });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Workflow action failed.";
      setActionError(message);
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Order
          </p>
          <h1 className="mt-3 break-words text-4xl leading-tight text-stone-950">{orderCode}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Workflow changes are submitted to backend admin APIs and validated server-side.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-fit justify-center rounded-full border border-stone-300 px-5 py-3 text-sm"
        >
          Back to Orders
        </Link>
      </section>

      {detailState.status === "loading" ? <StatePanel message="Loading order..." /> : null}
      {detailState.status === "error" ? <StatePanel message={detailState.error} tone="error" /> : null}

      {detailState.status === "ready" ? (
        <OrderDetail
          actionError={actionError}
          activeAction={activeAction}
          onWorkflowAction={handleWorkflowAction}
          order={detailState.order}
        />
      ) : null}
    </div>
  );
}

function OrderDetail({
  actionError,
  activeAction,
  onWorkflowAction,
  order,
}: {
  actionError: string | null;
  activeAction: WorkflowAction | null;
  onWorkflowAction: (action: WorkflowAction) => void;
  order: AdminOrderDetail;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Items
          </p>
          <h2 className="mt-2 text-2xl text-stone-950">Order snapshot</h2>
        </div>
        {order.items.map((item) => (
          <OrderItemRow currencyCode={order.currency_code} item={item} key={item.id} />
        ))}
      </section>

      <aside className="flex flex-col gap-5">
        <StatusCard order={order} />
        <WorkflowCard
          actionError={actionError}
          activeAction={activeAction}
          onWorkflowAction={onWorkflowAction}
        />
        <TotalsCard order={order} />
        <TimelineCard order={order} />
      </aside>
    </div>
  );
}

function OrderItemRow({
  currencyCode,
  item,
}: {
  currencyCode: string;
  item: AdminOrderItem;
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

function StatusCard({ order }: { order: AdminOrderDetail }) {
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

function WorkflowCard({
  actionError,
  activeAction,
  onWorkflowAction,
}: {
  actionError: string | null;
  activeAction: WorkflowAction | null;
  onWorkflowAction: (action: WorkflowAction) => void;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Workflow
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {workflowActions.map((item) => (
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:text-stone-400"
            disabled={activeAction !== null}
            key={item.action}
            onClick={() => onWorkflowAction(item.action)}
            type="button"
          >
            {activeAction === item.action ? "Working..." : item.label}
          </button>
        ))}
      </div>
      {actionError ? <p className="mt-4 text-sm text-red-700">{actionError}</p> : null}
    </section>
  );
}

function TotalsCard({ order }: { order: AdminOrderDetail }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Totals
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <StatusLine label="Subtotal" value={formatMoney(order.subtotal_amount, order.currency_code)} />
        <StatusLine label="Discount" value={formatMoney(order.discount_amount, order.currency_code)} />
        <StatusLine label="Shipping" value={formatMoney(order.shipping_amount, order.currency_code)} />
        <StatusLine label="Tax" value={formatMoney(order.tax_amount, order.currency_code)} />
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

function TimelineCard({ order }: { order: AdminOrderDetail }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
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

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : "rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600";

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
