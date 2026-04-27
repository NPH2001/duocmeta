"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  createAdminVariant,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchAdminVariant,
  updateAdminVariant,
  type AdminProduct,
  type AdminVariant,
  type AdminVariantInput,
} from "lib/admin";

type FormMode = "create" | "edit";

type FormState = {
  productId: string;
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  weightGrams: string;
  status: string;
  imageMediaId: string;
};

type VariantFormState =
  | { status: "loading"; products: []; variant: null; error: null }
  | { status: "ready"; products: AdminProduct[]; variant: AdminVariant | null; error: null }
  | { status: "error"; products: []; variant: null; error: string };

const emptyFormState: FormState = {
  productId: "",
  sku: "",
  barcode: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  weightGrams: "",
  status: "active",
  imageMediaId: "",
};

export function AdminVariantFormPage({
  mode,
  variantId,
}: {
  mode: FormMode;
  variantId?: string;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<VariantFormState>({
    status: "loading",
    products: [],
    variant: null,
    error: null,
  });
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      try {
        const variant = mode === "edit" && variantId ? await fetchAdminVariant(variantId) : null;
        const productResult = await fetchAdminProducts({ page: 1, pageSize: 100 });
        let products = productResult.data;

        if (variant && !products.some((product) => product.id === variant.product_id)) {
          products = [await fetchAdminProduct(variant.product_id), ...products];
        }

        if (isMounted) {
          setLoadState({ status: "ready", products, variant, error: null });
          setFormState(variant ? formStateFromVariant(variant) : emptyFormState);
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load variant form.";
          setLoadState({ status: "error", products: [], variant: null, error: message });
        }
      }
    }

    void loadFormData();

    return () => {
      isMounted = false;
    };
  }, [mode, variantId]);

  const title = mode === "create" ? "Create variant" : "Edit variant";
  const submitLabel = mode === "create" ? "Create Variant" : "Save Variant";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = variantInputFromForm(formState);
      const variant =
        mode === "create"
          ? await createAdminVariant(payload)
          : await updateAdminVariant(variantId ?? "", payload);

      router.push(`/admin/variants/${variant.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Variant save failed.";
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
            Variants
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">{title}</h1>
        </div>
        <Link
          href="/admin/variants"
          className="inline-flex h-fit justify-center rounded-full border border-stone-300 px-5 py-3 text-sm"
        >
          Back to Variants
        </Link>
      </section>

      {loadState.status === "loading" ? <StatePanel message="Loading variant form..." /> : null}
      {loadState.status === "error" ? <StatePanel message={loadState.error} tone="error" /> : null}

      {loadState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Product
                <select
                  className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case"
                  onChange={(event) => updateField("productId", event.target.value)}
                  required
                  value={formState.productId}
                >
                  <option value="">Select product</option>
                  {loadState.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="SKU" required value={formState.sku} onChange={(value) => updateField("sku", value)} />
              <TextField
                label="Barcode"
                value={formState.barcode}
                onChange={(value) => updateField("barcode", value)}
              />
              <TextField
                label="Price"
                required
                type="number"
                value={formState.price}
                onChange={(value) => updateField("price", value)}
              />
              <TextField
                label="Compare at price"
                type="number"
                value={formState.compareAtPrice}
                onChange={(value) => updateField("compareAtPrice", value)}
              />
              <TextField
                label="Cost price"
                type="number"
                value={formState.costPrice}
                onChange={(value) => updateField("costPrice", value)}
              />
              <TextField
                label="Weight grams"
                type="number"
                value={formState.weightGrams}
                onChange={(value) => updateField("weightGrams", value)}
              />
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Status
                <select
                  className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case"
                  onChange={(event) => updateField("status", event.target.value)}
                  value={formState.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <TextField
                label="Image media ID"
                value={formState.imageMediaId}
                onChange={(value) => updateField("imageMediaId", value)}
              />
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <InventoryPreparationPanel />
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

export function InventoryPreparationPanel() {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Inventory
      </p>
      <h2 className="mt-3 text-xl text-stone-950">Adjustment workflow</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Manual stock changes must be submitted through a backend inventory endpoint so reservations,
        audit records, and oversell protection stay authoritative.
      </p>
    </section>
  );
}

function TextField({
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "number" | "text";
  value: string;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
      <input
        className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case text-stone-950"
        onChange={(event) => onChange(event.target.value)}
        required={required}
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

function formStateFromVariant(variant: AdminVariant): FormState {
  return {
    productId: variant.product_id,
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    price: variant.price,
    compareAtPrice: variant.compare_at_price ?? "",
    costPrice: variant.cost_price ?? "",
    weightGrams: variant.weight_grams === null ? "" : String(variant.weight_grams),
    status: variant.status,
    imageMediaId: variant.image_media_id ?? "",
  };
}

function variantInputFromForm(formState: FormState): AdminVariantInput {
  return {
    product_id: formState.productId,
    sku: formState.sku,
    barcode: emptyToNull(formState.barcode),
    price: formState.price,
    compare_at_price: emptyToNull(formState.compareAtPrice),
    cost_price: emptyToNull(formState.costPrice),
    weight_grams: emptyToNumberOrNull(formState.weightGrams),
    status: formState.status,
    image_media_id: emptyToNull(formState.imageMediaId),
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
