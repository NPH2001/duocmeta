"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { AdminMediaUploader } from "features/admin/AdminMediaUploader";
import {
  buildAdminMediaUrl,
  createAdminProduct,
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAdminProduct,
  publishAdminProduct,
  updateAdminProduct,
  type AdminBrand,
  type AdminCategory,
  type AdminCategoryClassification,
  type AdminMedia,
  type AdminProduct,
  type AdminProductImage,
  type AdminProductInput,
} from "lib/admin";

type FormMode = "create" | "edit";
type SubmitIntent = "save" | "publish";

type FormState = {
  brandId: string;
  categoryIds: string[];
  primaryImageMediaId: string;
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
  primaryImageMediaId: "",
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
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categorySelectionTouched, setCategorySelectionTouched] = useState(false);
  const [imageSelectionTouched, setImageSelectionTouched] = useState(false);
  const [selectedPrimaryImage, setSelectedPrimaryImage] = useState<AdminMedia | AdminProductImage["media"] | null>(null);
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
          setSelectedPrimaryImage(product ? product.images.find((image) => image.is_primary && image.variant_id === null)?.media ?? null : null);
          setCategoryQuery("");
          setCategorySelectionTouched(false);
          setImageSelectionTouched(false);
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Không thể tải dữ liệu biểu mẫu.";
          setOptionsState({ status: "error", brands: [], categories: [], product: null, error: message });
        }
      }
    }

    void loadFormData();

    return () => {
      isMounted = false;
    };
  }, [mode, productId]);

  const title = mode === "create" ? "Thêm sản phẩm" : "Sửa sản phẩm";
  const saveLabel = mode === "create" ? "Lưu nháp" : "Lưu thay đổi";
  const publishLabel = mode === "create" ? "Thêm và đăng bán" : "Lưu và đăng bán";

  const selectedCategorySet = useMemo(() => new Set(formState.categoryIds), [formState.categoryIds]);
  const selectedCategories = useMemo(
    () => optionsState.status === "ready"
      ? optionsState.categories.filter((category) => selectedCategorySet.has(category.id))
      : [],
    [optionsState, selectedCategorySet]
  );
  const primaryCategory = selectedCategories[0] ?? null;
  const categoryRecommendations = useMemo(
    () =>
      optionsState.status === "ready"
        ? buildCategoryRecommendations(optionsState.categories, formState)
        : [],
    [formState, optionsState]
  );
  const filteredCategoryOptions = useMemo(() => {
    if (optionsState.status !== "ready") {
      return [];
    }

    const normalizedQuery = normalizeSearchText(categoryQuery);

    return optionsState.categories
      .filter((category) => !selectedCategorySet.has(category.id))
      .map((category) => ({
        category,
        searchableText: normalizeSearchText(
          [
            category.name,
            category.slug,
            category.classification.group_label,
            category.classification.guidance,
            ...category.classification.medicine_suggestions,
          ].join(" ")
        ),
      }))
      .filter(({ searchableText }) => !normalizedQuery || searchableText.includes(normalizedQuery))
      .sort((left, right) => {
        const leftStartsWith = normalizedQuery ? Number(left.searchableText.startsWith(normalizedQuery)) : 0;
        const rightStartsWith = normalizedQuery ? Number(right.searchableText.startsWith(normalizedQuery)) : 0;

        return (
          rightStartsWith - leftStartsWith ||
          (left.category.sort_order ?? 0) - (right.category.sort_order ?? 0) ||
          left.category.name.localeCompare(right.category.name)
        );
      })
      .slice(0, 8)
      .map(({ category }) => category);
  }, [categoryQuery, optionsState, selectedCategorySet]);
  const availableProductTypes = useMemo(
    () => buildAllowedProductTypes(selectedCategories, formState.productType),
    [formState.productType, selectedCategories]
  );
  const medicineSuggestions = primaryCategory?.classification.medicine_suggestions ?? [];
  const canPublish = mode === "create" || optionsState.status === "ready" && optionsState.product?.status !== "active";
  const statusMessage = buildStatusMessage(mode, optionsState);

  useEffect(() => {
    if (availableProductTypes.length === 0) {
      return;
    }

    if (!availableProductTypes.includes(formState.productType)) {
      setFormState((current) => ({ ...current, productType: availableProductTypes[0] }));
    }
  }, [availableProductTypes, formState.productType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const submitIntent = getSubmitIntent(event);

      if (formState.categoryIds.length === 0) {
        throw new Error("Hãy chọn ít nhất 1 danh mục để thống nhất phân loại thuốc trước khi lưu.");
      }

      const payload = productInputFromForm(formState);
      if (mode === "edit" && !categorySelectionTouched) {
        delete payload.category_ids;
      }
      if (mode === "edit" && !imageSelectionTouched) {
        delete payload.primary_image_media_id;
      }
      const product =
        mode === "create"
          ? await createAdminProduct(payload)
          : await updateAdminProduct(productId ?? "", payload);

      if (submitIntent === "publish" && product.status !== "active") {
        await publishAdminProduct(product.id);
      }

      router.push(`/admin/products/${product.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Không thể lưu sản phẩm.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function addCategory(categoryId: string) {
    setCategorySelectionTouched(true);
    setFormState((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId) ? current.categoryIds : [...current.categoryIds, categoryId],
    }));
    setCategoryQuery("");
  }

  function removeCategory(categoryId: string) {
    setCategorySelectionTouched(true);
    setFormState((current) => ({
      ...current,
      categoryIds: current.categoryIds.filter((id) => id !== categoryId),
    }));
  }

  function handlePrimaryImageUploaded(media: AdminMedia) {
    setImageSelectionTouched(true);
    setSelectedPrimaryImage(media);
    setFormState((current) => ({
      ...current,
      primaryImageMediaId: media.id,
    }));
  }

  function removePrimaryImage() {
    setImageSelectionTouched(true);
    setSelectedPrimaryImage(null);
    setFormState((current) => ({
      ...current,
      primaryImageMediaId: "",
    }));
  }

  function applyCategoryRecommendation(category: AdminCategory) {
    setCategorySelectionTouched(true);
    setFormState((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(category.id)
        ? [category.id, ...current.categoryIds.filter((id) => id !== category.id)]
        : [category.id, ...current.categoryIds],
      productType: category.classification.allowed_product_types.includes(current.productType)
        ? current.productType
        : category.classification.allowed_product_types[0] ?? current.productType,
    }));
    setCategoryQuery("");
  }

  function applyMedicineSuggestion(suggestion: string, classification: AdminCategoryClassification) {
    setFormState((current) => ({
      ...current,
      name: suggestion,
      slug: current.slug.trim() ? current.slug : slugify(suggestion),
      productType: classification.allowed_product_types.includes(current.productType)
        ? current.productType
        : classification.allowed_product_types[0] ?? current.productType,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Sản phẩm
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-emerald-950">{title}</h1>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex h-fit justify-center rounded-full border border-emerald-300 px-5 py-3 text-sm"
        >
          Quay lại sản phẩm
        </Link>
      </section>

      {optionsState.status === "loading" ? <StatePanel message="Đang tải biểu mẫu sản phẩm..." /> : null}
      {optionsState.status === "error" ? <StatePanel message={optionsState.error} tone="error" /> : null}

      {optionsState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-emerald-100 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Tên"
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
              <TextField
                label="Tiền tệ"
                maxLength={3}
                required
                value={formState.currencyCode}
                onChange={(value) => updateField("currencyCode", value.toUpperCase())}
              />
              <TextField
                label="Giá Bán"
                type="number"
                value={formState.minPrice}
                onChange={(value) => updateField("minPrice", value)}
              />
              
              <label className="flex items-center gap-3 rounded-xl border border-emerald-100 p-4 text-sm">
                <input
                  checked={formState.isFeatured}
                  onChange={(event) => updateField("isFeatured", event.target.checked)}
                  type="checkbox"
                />
                Sản phẩm nổi bật
              </label>
            </div>

            <div className="mt-5 grid gap-5">
              <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Ảnh sản phẩm
              </p>
              <div className="mt-4 space-y-4">
                <AdminMediaUploader label="Upload ảnh chính" onUploaded={handlePrimaryImageUploaded} />
                {selectedPrimaryImage ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          alt={selectedPrimaryImage.alt_text ?? selectedPrimaryImage.filename}
                          className="object-cover"
                          fill
                          sizes="20px"
                          src={buildAdminMediaUrl(selectedPrimaryImage.storage_key)}
                          unoptimized
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-emerald-950">{selectedPrimaryImage.filename}</p>
                    <p className="mt-1 break-all text-xs text-emerald-800/80">{selectedPrimaryImage.storage_key}</p>
                    <button
                      className="mt-4 rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800 transition hover:border-emerald-500 hover:text-emerald-950"
                      onClick={removePrimaryImage}
                      type="button"
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-emerald-900/75">
                    Chưa có ảnh chính cho sản phẩm.
                  </p>
                )}
              </div>
            </section>
            </div>

            <div className="mt-5 grid gap-5">
              <TextAreaField
                label="Mô tả ngắn"
                value={formState.shortDescription}
                onChange={(value) => updateField("shortDescription", value)}
              />
              <TextAreaField
                label="Mô tả"
                minRows={8}
                value={formState.description}
                onChange={(value) => updateField("description", value)}
              />
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Trạng thái hiển thị
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                {statusMessage}
              </p>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Danh mục
              </p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-950">Danh mục đã chọn</p>
                  {selectedCategories.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-500 hover:bg-white"
                        >
                          {category.name} ×
                        </button>
                      ))}
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-emerald-900/75">
                      Chưa chọn danh mục nào.
                    </p>
                  )}
                </div>

                <label className="block text-sm font-semibold text-emerald-950">
                  Tìm danh mục để thêm
                  <input
                    className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm font-normal text-emerald-950"
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Nhập tên, slug hoặc từ khóa điều trị"
                  />
                </label>

                {optionsState.categories.length === 0 ? (
                  <p className="text-sm text-emerald-900/75">Chưa có danh mục.</p>
                ) : filteredCategoryOptions.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredCategoryOptions.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => addCategory(category.id)}
                        className="rounded-xl border border-emerald-100 bg-white p-4 text-left transition hover:border-emerald-300"
                      >
                        <span className="block text-sm font-semibold text-emerald-900">{category.name}</span>
                        {/* <span className="mt-2 block text-xs leading-5 text-emerald-800/80">
                          {category.classification.guidance}
                        </span> */}
                      </button>
                    ))}
                    <p className="text-xs leading-5 text-emerald-800/80">
                      Chỉ hiển thị tối đa 8 kết quả gần nhất. Hãy nhập thêm từ khóa nếu cần thu hẹp danh mục.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-emerald-900/75">
                    Không tìm thấy danh mục phù hợp với từ khóa hiện tại.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Danh sách thuốc theo danh mục
              </p>
              {primaryCategory ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">{primaryCategory.name}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                      {primaryCategory.classification.guidance}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicineSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => applyMedicineSuggestion(suggestion, primaryCategory.classification)}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-left text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-emerald-800/80">
                    Nhấn vào một thuốc tham chiếu để điền nhanh tên thuốc và khóa loại sản phẩm đúng với danh mục.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-emerald-900/75">
                  Chọn ít nhất một danh mục để xem danh sách thuốc tham chiếu tương ứng.
                </p>
              )}
            </section>

            {submitError ? <StatePanel message={submitError} tone="error" /> : null}
            <div className="grid gap-3 md:grid-cols-2">
              <button
                className={[
                  "rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold uppercase",
                  "tracking-[0.16em] text-emerald-900 transition hover:border-emerald-500 hover:text-emerald-950 disabled:border-emerald-200 disabled:text-emerald-600/70",
                ].join(" ")}
                disabled={isSubmitting}
                type="submit"
                value="save"
              >
                {isSubmitting ? "Đang lưu..." : saveLabel}
              </button>
              {canPublish ? (
                <button
                  className={[
                    "rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold uppercase",
                    "tracking-[0.16em] text-white transition hover:bg-emerald-500 disabled:bg-emerald-400",
                  ].join(" ")}
                  disabled={isSubmitting}
                  type="submit"
                  value="publish"
                >
                  {isSubmitting ? "Đang đăng bán..." : publishLabel}
                </button>
              ) : null}
            </div>
          </aside>
        </form>
      ) : null}
    </div>
  );
}

function TextField({
  helpText,
  label,
  maxLength,
  onChange,
  options,
  required = false,
  type = "text",
  value,
}: {
  helpText?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  options?: string[];
  required?: boolean;
  type?: "number" | "text";
  value: string;
}) {
  const normalizedOptions = options?.filter(Boolean) ?? [];

  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {label}
      {normalizedOptions.length > 0 ? (
        <select
          className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950"
          onChange={(event) => onChange(event.target.value)}
          required={required}
          value={value}
        >
          {normalizedOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950"
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={type}
          value={value}
        />
      )}
      {helpText ? <span className="mt-2 block text-[11px] normal-case tracking-normal text-emerald-900/70">{helpText}</span> : null}
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
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {label}
      <textarea
        className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950"
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
      : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";

  return <div className={className}>{message}</div>;
}

function formStateFromProduct(product: AdminProduct): FormState {
  return {
    brandId: product.brand_id ?? "",
    categoryIds: product.categories
      .slice()
      .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
      .map((assignment) => assignment.category_id),
    primaryImageMediaId: product.images.find((image) => image.is_primary && image.variant_id === null)?.media_id ?? "",
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
    primary_image_media_id: emptyToNull(formState.primaryImageMediaId),
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

function buildAllowedProductTypes(categories: AdminCategory[], currentProductType: string): string[] {
  const options = categories.flatMap((category) => category.classification.allowed_product_types);
  const uniqueOptions = Array.from(new Set(options));

  if (currentProductType && !uniqueOptions.includes(currentProductType)) {
    uniqueOptions.push(currentProductType);
  }

  if (uniqueOptions.length === 0) {
    return [currentProductType || "simple"];
  }

  return uniqueOptions;
}

function buildCategoryRecommendations(categories: AdminCategory[], formState: FormState) {
  const query = normalizeSearchText([formState.name, formState.slug, formState.shortDescription, formState.description].join(" "));

  if (!query) {
    return [];
  }

  const queryTokens = query.split(" ").filter((token) => token.length > 1);

  return categories
    .map((category) => {
      const fields = [
        category.name,
        category.slug,
        category.classification.group_label,
        category.classification.guidance,
        ...category.classification.medicine_suggestions,
      ];
      const searchableText = normalizeSearchText(fields.join(" "));
      let score = 0;

      if (searchableText.includes(query)) {
        score += 6;
      }

      const matchedTokens = queryTokens.filter((token) => searchableText.includes(token));
      score += matchedTokens.length * 2;

      const matchedSuggestion = category.classification.medicine_suggestions.find((suggestion) =>
        normalizeSearchText(suggestion).includes(query) ||
        queryTokens.some((token) => normalizeSearchText(suggestion).includes(token))
      );

      if (matchedSuggestion) {
        score += 4;
      }

      if (score === 0) {
        return null;
      }

      const reason = matchedSuggestion
        ? `Khớp với thuốc tham chiếu: ${matchedSuggestion}`
        : `Khớp từ khóa: ${matchedTokens.slice(0, 3).join(", ")}`;

      return { category, reason, score };
    })
    .filter((recommendation): recommendation is { category: AdminCategory; reason: string; score: number } => recommendation !== null)
    .sort(
      (left, right) =>
        right.score - left.score || (left.category.sort_order ?? 0) - (right.category.sort_order ?? 0)
    )
    .slice(0, 3);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getSubmitIntent(event: FormEvent<HTMLFormElement>): SubmitIntent {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter;

  if (submitter instanceof HTMLButtonElement && submitter.value === "publish") {
    return "publish";
  }

  return "save";
}

function buildStatusMessage(mode: FormMode, optionsState: OptionsState): string {
  if (mode === "create") {
    return "Sản phẩm mới mặc định được lưu ở trạng thái nháp. Chỉ sản phẩm active đã đăng bán mới hiển thị ở storefront.";
  }

  if (optionsState.status !== "ready" || optionsState.product === null) {
    return "Đang tải trạng thái sản phẩm hiện tại.";
  }

  if (optionsState.product.status === "active" && optionsState.product.published_at) {
    return "Sản phẩm này đã active và đang hiển thị ở storefront.";
  }

  return "Sản phẩm này đang ở trạng thái nháp/chưa đăng bán. Hãy dùng nút Lưu và đăng bán để đưa sản phẩm ra storefront.";
}
