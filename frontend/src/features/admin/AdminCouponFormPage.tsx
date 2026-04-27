"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  createAdminCoupon,
  fetchAdminCoupon,
  updateAdminCoupon,
  type AdminCoupon,
  type AdminCouponInput,
} from "lib/admin";

type FormMode = "create" | "edit";

type FormState = {
  code: string;
  name: string;
  discountType: string;
  discountValue: string;
  minOrderValue: string;
  maxDiscountValue: string;
  usageLimitTotal: string;
  usageLimitPerUser: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type CouponFormLoadState =
  | { status: "loading"; coupon: null; error: null }
  | { status: "ready"; coupon: AdminCoupon | null; error: null }
  | { status: "error"; coupon: null; error: string };

const emptyFormState: FormState = {
  code: "",
  name: "",
  discountType: "fixed_amount",
  discountValue: "",
  minOrderValue: "",
  maxDiscountValue: "",
  usageLimitTotal: "",
  usageLimitPerUser: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export function AdminCouponFormPage({
  couponId,
  mode,
}: {
  couponId?: string;
  mode: FormMode;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<CouponFormLoadState>({
    status: "loading",
    coupon: null,
    error: null,
  });
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCoupon() {
      if (mode === "create") {
        setLoadState({ status: "ready", coupon: null, error: null });
        setFormState(emptyFormState);
        return;
      }

      try {
        const coupon = await fetchAdminCoupon(couponId ?? "");
        if (isMounted) {
          setLoadState({ status: "ready", coupon, error: null });
          setFormState(formStateFromCoupon(coupon));
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load coupon form.";
          setLoadState({ status: "error", coupon: null, error: message });
        }
      }
    }

    void loadCoupon();

    return () => {
      isMounted = false;
    };
  }, [couponId, mode]);

  const title = mode === "create" ? "Create coupon" : "Edit coupon";
  const submitLabel = mode === "create" ? "Create Coupon" : "Save Coupon";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = couponInputFromForm(formState);
      const coupon =
        mode === "create"
          ? await createAdminCoupon(payload)
          : await updateAdminCoupon(couponId ?? "", payload);

      router.push(`/admin/coupons/${coupon.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Coupon save failed.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Coupons
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Define coupon metadata for backend validation. Checkout totals and coupon eligibility are
            never calculated here.
          </p>
        </div>
        <Link
          href="/admin/coupons"
          className="inline-flex h-fit justify-center rounded-full border border-stone-300 px-5 py-3 text-sm"
        >
          Back to Coupons
        </Link>
      </section>

      {loadState.status === "loading" ? <StatePanel message="Loading coupon form..." /> : null}
      {loadState.status === "error" ? <StatePanel message={loadState.error} tone="error" /> : null}

      {loadState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Code"
                maxLength={100}
                required
                value={formState.code}
                onChange={(value) => updateField("code", value.toUpperCase())}
              />
              <TextField
                label="Name"
                maxLength={255}
                required
                value={formState.name}
                onChange={(value) => updateField("name", value)}
              />
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Discount type
                <select
                  className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case"
                  onChange={(event) => updateField("discountType", event.target.value)}
                  value={formState.discountType}
                >
                  <option value="fixed_amount">Fixed amount</option>
                  <option value="percent">Percent</option>
                </select>
              </label>
              <TextField
                label="Discount value"
                required
                type="number"
                value={formState.discountValue}
                onChange={(value) => updateField("discountValue", value)}
              />
              <TextField
                label="Minimum order value"
                type="number"
                value={formState.minOrderValue}
                onChange={(value) => updateField("minOrderValue", value)}
              />
              <TextField
                label="Maximum discount value"
                type="number"
                value={formState.maxDiscountValue}
                onChange={(value) => updateField("maxDiscountValue", value)}
              />
              <TextField
                label="Total usage limit"
                type="number"
                value={formState.usageLimitTotal}
                onChange={(value) => updateField("usageLimitTotal", value)}
              />
              <TextField
                label="Per-user usage limit"
                type="number"
                value={formState.usageLimitPerUser}
                onChange={(value) => updateField("usageLimitPerUser", value)}
              />
              <TextField
                label="Starts at"
                type="datetime-local"
                value={formState.startsAt}
                onChange={(value) => updateField("startsAt", value)}
              />
              <TextField
                label="Ends at"
                type="datetime-local"
                value={formState.endsAt}
                onChange={(value) => updateField("endsAt", value)}
              />
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4 text-sm">
                <input
                  checked={formState.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                  type="checkbox"
                />
                Active coupon
              </label>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <BackendAuthorityPanel />
            {submitError ? <StatePanel message={submitError} tone="error" /> : null}
            <button
              className={[
                "rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase",
                "tracking-[0.16em] text-white disabled:bg-stone-400",
              ].join(" ")}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </aside>
        </form>
      ) : null}
    </div>
  );
}

function BackendAuthorityPanel() {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Validation
      </p>
      <h2 className="mt-3 text-xl text-stone-950">Backend-owned rules</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        The admin UI only submits coupon definitions. Active windows, minimum order values, usage
        limits, and discount caps are enforced by backend services during checkout preview and order
        placement.
      </p>
    </section>
  );
}

function TextField({
  label,
  maxLength,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "datetime-local" | "number" | "text";
  value: string;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
      <input
        className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case text-stone-950"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : "rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600";

  return <div className={className}>{message}</div>;
}

function formStateFromCoupon(coupon: AdminCoupon): FormState {
  return {
    code: coupon.code,
    name: coupon.name,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    minOrderValue: coupon.min_order_value ?? "",
    maxDiscountValue: coupon.max_discount_value ?? "",
    usageLimitTotal: coupon.usage_limit_total === null ? "" : String(coupon.usage_limit_total),
    usageLimitPerUser: coupon.usage_limit_per_user === null ? "" : String(coupon.usage_limit_per_user),
    startsAt: isoToDateTimeLocal(coupon.starts_at),
    endsAt: isoToDateTimeLocal(coupon.ends_at),
    isActive: coupon.is_active,
  };
}

function couponInputFromForm(formState: FormState): AdminCouponInput {
  return {
    code: formState.code,
    name: formState.name,
    discount_type: formState.discountType,
    discount_value: formState.discountValue,
    min_order_value: emptyToNull(formState.minOrderValue),
    max_discount_value: emptyToNull(formState.maxDiscountValue),
    usage_limit_total: emptyToNumberOrNull(formState.usageLimitTotal),
    usage_limit_per_user: emptyToNumberOrNull(formState.usageLimitPerUser),
    starts_at: dateTimeLocalToIsoOrNull(formState.startsAt),
    ends_at: dateTimeLocalToIsoOrNull(formState.endsAt),
    is_active: formState.isActive,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function emptyToNumberOrNull(value: string): number | null {
  const trimmed = value.trim();

  return trimmed ? Number(trimmed) : null;
}

function isoToDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function dateTimeLocalToIsoOrNull(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return new Date(trimmed).toISOString();
}
