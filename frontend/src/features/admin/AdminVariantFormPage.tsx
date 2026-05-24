"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { AdminMediaUploader } from "features/admin/AdminMediaUploader";
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
          const message = caughtError instanceof Error ? caughtError.message : "Không thể tải biểu mẫu phiên bản.";
          setLoadState({ status: "error", products: [], variant: null, error: message });
        }
      }
    }

    void loadFormData();

    return () => {
      isMounted = false;
    };
  }, [mode, variantId]);

  const title = mode === "create" ? "Thêm phiên bản" : "Sửa phiên bản";
  const submitLabel = mode === "create" ? "Thêm phiên bản" : "Lưu phiên bản";

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
      const message = caughtError instanceof Error ? caughtError.message : "Không thể lưu phiên bản.";
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
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Phiên bản
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-emerald-950">{title}</h1>
        </div>
        <Link
          href="/admin/variants"
          className="inline-flex h-fit justify-center rounded-full border border-emerald-300 px-5 py-3 text-sm"
        >
          Quay lại phiên bản
        </Link>
      </section>

      {loadState.status === "loading" ? <StatePanel message="Đang tải biểu mẫu phiên bản..." /> : null}
      {loadState.status === "error" ? <StatePanel message={loadState.error} tone="error" /> : null}

      {loadState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-emerald-100 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Sản phẩm
                <select
                  className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case"
                  onChange={(event) => updateField("productId", event.target.value)}
                  required
                  value={formState.productId}
                >
                  <option value="">Chọn sản phẩm</option>
                  {loadState.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="SKU" required value={formState.sku} onChange={(value) => updateField("sku", value)} />
              <TextField
                label="Mã vạch"
                value={formState.barcode}
                onChange={(value) => updateField("barcode", value)}
              />
              <TextField
                label="Giá"
                required
                type="number"
                value={formState.price}
                onChange={(value) => updateField("price", value)}
              />
              <TextField
                label="Giá so sánh"
                type="number"
                value={formState.compareAtPrice}
                onChange={(value) => updateField("compareAtPrice", value)}
              />
              <TextField
                label="Giá vốn"
                type="number"
                value={formState.costPrice}
                onChange={(value) => updateField("costPrice", value)}
              />
              <TextField
                label="Khối lượng (gram)"
                type="number"
                value={formState.weightGrams}
                onChange={(value) => updateField("weightGrams", value)}
              />
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Trạng thái
                <select
                  className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case"
                  onChange={(event) => updateField("status", event.target.value)}
                  value={formState.status}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm ngừng</option>
                  <option value="archived">Đã lưu trữ</option>
                </select>
              </label>
              <TextField
                label="ID hình ảnh"
                value={formState.imageMediaId}
                onChange={(value) => updateField("imageMediaId", value)}
              />
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <AdminMediaUploader
              label="Ảnh phiên bản"
              onUploaded={(media) => updateField("imageMediaId", media.id)}
            />
            <InventoryPreparationPanel />
            {submitError ? <StatePanel message={submitError} tone="error" /> : null}
            <button
              className={[
                "rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold uppercase",
                "tracking-[0.16em] text-white transition hover:bg-emerald-500 disabled:bg-emerald-400",
              ].join(" ")}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Đang lưu..." : submitLabel}
            </button>
          </aside>
        </form>
      ) : null}
    </div>
  );
}

export function InventoryPreparationPanel() {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Tồn kho
      </p>
      <h2 className="mt-3 text-xl text-emerald-950">Quy trình điều chỉnh</h2>
      <p className="mt-3 text-sm leading-6 text-emerald-900/75">
        Mọi thay đổi tồn kho thủ công phải đi qua endpoint tồn kho của backend để đặt giữ hàng,
        nhật ký kiểm toán và kiểm soát bán vượt tồn được xác thực tập trung.
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
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {label}
      <input
        className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950"
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
      : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";

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
