"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminCoupons,
  updateAdminCoupon,
  type AdminCoupon,
  type AdminPaginationMeta,
} from "lib/admin";

type CouponsState =
  | { status: "loading"; coupons: []; meta: null; error: null }
  | { status: "ready"; coupons: AdminCoupon[]; meta: AdminPaginationMeta; error: null }
  | { status: "error"; coupons: []; meta: null; error: string };

const pageSize = 20;

export function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [couponsState, setCouponsState] = useState<CouponsState>({
    status: "loading",
    coupons: [],
    meta: null,
    error: null,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setCouponsState({ status: "loading", coupons: [], meta: null, error: null });

    fetchAdminCoupons({ page, pageSize })
      .then((result) => {
        if (isMounted) {
          setCouponsState({ status: "ready", coupons: result.data, meta: result.meta, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load coupons.";
          setCouponsState({ status: "error", coupons: [], meta: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  async function handleActiveToggle(coupon: AdminCoupon) {
    setActionError(null);

    try {
      const updatedCoupon = await updateAdminCoupon(coupon.id, {
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value,
        max_discount_value: coupon.max_discount_value,
        usage_limit_total: coupon.usage_limit_total,
        usage_limit_per_user: coupon.usage_limit_per_user,
        starts_at: coupon.starts_at,
        ends_at: coupon.ends_at,
        is_active: !coupon.is_active,
      });

      if (couponsState.status === "ready") {
        setCouponsState({
          status: "ready",
          meta: couponsState.meta,
          error: null,
          coupons: couponsState.coupons.map((item) =>
            item.id === updatedCoupon.id ? updatedCoupon : item
          ),
        });
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Coupon action failed.";
      setActionError(message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Marketing
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">Coupons</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Manage coupon definitions through backend admin APIs. Eligibility, discount calculation,
            and checkout enforcement remain server-side.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className={[
            "inline-flex h-fit justify-center rounded-full bg-stone-950 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
          ].join(" ")}
        >
          Create Coupon
        </Link>
      </section>

      {actionError ? <StatePanel message={actionError} tone="error" /> : null}
      {couponsState.status === "loading" ? <StatePanel message="Loading coupons..." /> : null}
      {couponsState.status === "error" ? <StatePanel message={couponsState.error} tone="error" /> : null}

      {couponsState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {couponsState.coupons.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No coupons found.</div>
            ) : (
              couponsState.coupons.map((coupon) => (
                <CouponRow coupon={coupon} key={coupon.id} onActiveToggle={handleActiveToggle} />
              ))
            )}
          </section>
          <PaginationControls meta={couponsState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function CouponRow({
  coupon,
  onActiveToggle,
}: {
  coupon: AdminCoupon;
  onActiveToggle: (coupon: AdminCoupon) => void;
}) {
  return (
    <article className="grid gap-4 border-b border-stone-100 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-stone-950">{coupon.code}</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
            {coupon.is_active ? "active" : "inactive"}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
            {formatDiscount(coupon)}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-700">{coupon.name}</p>
        <p className="mt-2 text-sm text-stone-600">
          Min order {formatOptionalMoney(coupon.min_order_value)} / Max discount{" "}
          {formatOptionalMoney(coupon.max_discount_value)}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Active {formatOptionalDate(coupon.starts_at)} to {formatOptionalDate(coupon.ends_at)}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-center text-sm text-stone-700"
          href={`/admin/coupons/${coupon.id}/edit`}
        >
          Edit
        </Link>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
          onClick={() => onActiveToggle(coupon)}
          type="button"
        >
          {coupon.is_active ? "Deactivate" : "Activate"}
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
        Page {meta.page} of {meta.total_pages || 1} / {meta.total} coupons
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

function formatDiscount(coupon: AdminCoupon): string {
  if (coupon.discount_type === "percent") {
    return `${Number(coupon.discount_value)}%`;
  }

  return formatMoney(coupon.discount_value);
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

function formatOptionalDate(value: string | null): string {
  if (!value) {
    return "not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}
