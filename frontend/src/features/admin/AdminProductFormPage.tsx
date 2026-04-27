"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  createAdminProduct,
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAdminProduct,
  updateAdminProduct,
  type AdminBrand,
  type AdminCategory,
  type AdminProduct,
  type AdminProductInput,
} from "lib/admin";

type FormMode = "create" | "edit";

type FormState = {
  brandId: string;
  categoryIds: string[];
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  productType: string;
  isFeatured: boolean;
  currencyCode: string;
  minPrice: string;
  maxPrice: string;
};

type OptionsState =
  | { status: "loading"; brands: []; categories: []; product: null; error: null }
  | {
      status: "ready";
      brands: AdminBrand[];
      categories: AdminCategory[];
      product: AdminProduct | null;
      error: null;
    }
  | { status: "error"; brands: []; categories: []; product: null; error: string };

const emptyFormState: FormState = {
  brandId: "",
  categoryIds: [],
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  productType: "simple",
  isFeatured: false,
  currencyCode: "VND",
  minPrice: "",
  maxPrice: "",
};

export function AdminProductFormPage({
  mode,
  productId,
}: {
  mode: FormMode;
  productId?: string;
}) {
  const router = useRouter();
  const [optionsState, setOptionsState] = useState<OptionsState>({
    status: "loading",
    brands: [],
    categories: [],
    product: null,
    error: null,
  });
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [categorySelectionTouched, setCategorySelectionTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      try {
        const [brands, categories, product] = await Promise.all([
          fetchAdminBrands(),
          fetchAdminCategories(),
          mode === "edit" && productId ? fetchAdminProduct(productId) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setOptionsState({ status: "ready", brands, categories, product, error: null });
          setFormState(product ? formStateFromProduct(product) : emptyFormState);
          setCategorySelectionTouched(false);
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load form data.";
          setOptionsState({ status: "error", brands: [], categories: [], product: null, error: message });
        }
      }
    }

    void loadFormData();

    return () => {
      isMounted = false;
    };
  }, [mode, productId]);

  const title = mode === "create" ? "Create product" : "Edit product";
  const submitLabel = mode === "create" ? "Create Product" : "Save Product";

  const selectedCategorySet = useMemo(() => new Set(formState.categoryIds), [formState.categoryIds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = productInputFromForm(formState);
      if (mode === "edit" && !categorySelectionTouched) {
        delete payload.category_ids;
      }
      const product =
        mode === "create"
          ? await createAdminProduct(payload)
          : await updateAdminProduct(productId ?? "", payload);

      router.push(`/admin/products/${product.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Product save failed.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function toggleCategory(categoryId: string) {
    setCategorySelectionTouched(true);
    setFormState((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Products
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">{title}</h1>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex h-fit justify-center rounded-full border border-stone-300 px-5 py-3 text-sm"
        >
          Back to Products
        </Link>
      </section>

      {optionsState.status === "loading" ? <StatePanel message="Loading product form..." /> : null}
      {optionsState.status === "error" ? <StatePanel message={optionsState.error} tone="error" /> : null}

      {optionsState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Name"
                required
                value={formState.name}
                onChange={(value) => updateField("name", value)}
              />
              <TextField
                label="Slug"
                required
                value={formState.slug}
                onChange={(value) => updateField("slug", value)}
              />
              <TextField label="SKU" value={formState.sku} onChange={(value) => updateField("sku", value)} />
              <TextField
                label="Product type"
                required
                value={formState.productType}
                onChange={(value) => updateField("productType", value)}
              />
              <TextField
                label="Currency"
                maxLength={3}
                required
                value={formState.currencyCode}
                onChange={(value) => updateField("currencyCode", value.toUpperCase())}
              />
              <TextField
                label="Minimum price"
                type="number"
                value={formState.minPrice}
                onChange={(value) => updateField("minPrice", value)}
              />
              <TextField
                label="Maximum price"
                type="number"
                value={formState.maxPrice}
                onChange={(value) => updateField("maxPrice", value)}
              />
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4 text-sm">
                <input
                  checked={formState.isFeatured}
                  onChange={(event) => updateField("isFeatured", event.target.checked)}
                  type="checkbox"
                />
                Featured product
              </label>
            </div>

            <div className="mt-5 grid gap-5">
              <TextAreaField
                label="Short description"
                value={formState.shortDescription}
                onChange={(value) => updateField("shortDescription", value)}
              />
              <TextAreaField
                label="Description"
                minRows={8}
                value={formState.description}
                onChange={(value) => updateField("description", value)}
              />
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Brand
                <select
                  className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case"
                  value={formState.brandId}
                  onChange={(event) => updateField("brandId", event.target.value)}
                >
                  <option value="">No brand</option>
                  {optionsState.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Categories
              </p>
              <div className="mt-4 flex max-h-72 flex-col gap-3 overflow-auto pr-1">
                {optionsState.categories.length === 0 ? (
                  <p className="text-sm text-stone-600">No categories available.</p>
                ) : (
                  optionsState.categories.map((category) => (
                    <label className="flex items-center gap-3 text-sm text-stone-700" key={category.id}>
                      <input
                        checked={selectedCategorySet.has(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        type="checkbox"
                      />
                      {category.name}
                    </label>
                  ))
                )}
              </div>
            </section>

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
  type?: "number" | "text";
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
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  minRows = 4,
  onChange,
  value,
}: {
  label: string;
  minRows?: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
      <textarea
        className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case text-stone-950"
        onChange={(event) => onChange(event.target.value)}
        rows={minRows}
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

function formStateFromProduct(product: AdminProduct): FormState {
  return {
    brandId: product.brand_id ?? "",
    categoryIds: [],
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? "",
    shortDescription: product.short_description ?? "",
    description: product.description ?? "",
    productType: product.product_type,
    isFeatured: product.is_featured,
    currencyCode: product.currency_code,
    minPrice: product.min_price ?? "",
    maxPrice: product.max_price ?? "",
  };
}

function productInputFromForm(formState: FormState): AdminProductInput {
  return {
    brand_id: emptyToNull(formState.brandId),
    category_ids: formState.categoryIds,
    name: formState.name,
    slug: formState.slug,
    sku: emptyToNull(formState.sku),
    short_description: emptyToNull(formState.shortDescription),
    description: emptyToNull(formState.description),
    product_type: formState.productType,
    is_featured: formState.isFeatured,
    currency_code: formState.currencyCode,
    min_price: emptyToNull(formState.minPrice),
    max_price: emptyToNull(formState.maxPrice),
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}
