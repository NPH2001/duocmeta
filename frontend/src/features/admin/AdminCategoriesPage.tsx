"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminCategoriesPage,
  type AdminCategory,
  type AdminCategoryInput,
  type AdminPaginationMeta,
} from "lib/admin";

type CategoriesState =
  | { status: "loading"; categories: []; meta: null; error: null }
  | { status: "ready"; categories: AdminCategory[]; meta: AdminPaginationMeta; error: null }
  | { status: "error"; categories: []; meta: null; error: string };

type ParentOptionsState =
  | { status: "loading"; categories: AdminCategory[]; error: null }
  | { status: "ready"; categories: AdminCategory[]; error: null }
  | { status: "error"; categories: AdminCategory[]; error: string };

type CategoryFormState = {
  parent_id: string | null;
  name: string;
  slug: string;
  description: string;
  sort_order: string;
  is_active: boolean;
};

const pageSize = 20;
const initialFormState: CategoryFormState = {
  parent_id: null,
  name: "",
  slug: "",
  description: "",
  sort_order: "0",
  is_active: true,
};

export function AdminCategoriesPage() {
  const [page, setPage] = useState(1);
  const [categoriesState, setCategoriesState] = useState<CategoriesState>({
    status: "loading",
    categories: [],
    meta: null,
    error: null,
  });
  const [parentOptionsState, setParentOptionsState] = useState<ParentOptionsState>({
    status: "loading",
    categories: [],
    error: null,
  });
  const [formState, setFormState] = useState<CategoryFormState>(initialFormState);
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  async function loadCategories(nextPage: number) {
    setCategoriesState({ status: "loading", categories: [], meta: null, error: null });

    try {
      const result = await fetchAdminCategoriesPage({ page: nextPage, pageSize });
      setCategoriesState({ status: "ready", categories: result.data, meta: result.meta, error: null });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Không thể tải danh mục.";
      setCategoriesState({ status: "error", categories: [], meta: null, error: message });
    }
  }

  async function loadParentOptions() {
    setParentOptionsState((current) => ({ ...current, status: "loading", error: null }));

    try {
      const categories = await fetchAdminCategories();
      setParentOptionsState({ status: "ready", categories, error: null });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể tải danh sách danh mục cha.";
      setParentOptionsState({ status: "error", categories: [], error: message });
    }
  }

  useEffect(() => {
    void loadCategories(page);
  }, [page]);

  useEffect(() => {
    void loadParentOptions();
  }, []);

  const parentOptions = useMemo(
    () => parentOptionsState.categories,
    [parentOptionsState]
  );
  const parentNameById = useMemo(
    () =>
      new Map(
        parentOptions.map((category) => [category.id, category.name] as const)
      ),
    [parentOptions]
  );

  function handleNameChange(value: string) {
    setFormState((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : normalizeSlug(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setFormState((current) => ({ ...current, slug: normalizeSlug(value) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const name = formState.name.trim();
    const slug = normalizeSlug(formState.slug);
    const sortOrder = Number.parseInt(formState.sort_order, 10);

    if (!name) {
      setSubmitError("Tên danh mục là bắt buộc.");
      return;
    }

    if (!slug) {
      setSubmitError("Slug danh mục là bắt buộc.");
      return;
    }

    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      setSubmitError("Thứ tự sắp xếp phải là số nguyên không âm.");
      return;
    }

    setIsSubmitting(true);

    const payload: AdminCategoryInput = {
      parent_id: formState.parent_id,
      name,
      slug,
      description: formState.description.trim() || null,
      sort_order: sortOrder,
      is_active: formState.is_active,
    };

    try {
      await createAdminCategory(payload);
      setFormState(initialFormState);
      setSlugTouched(false);
      setSubmitSuccess("Đã thêm danh mục và lưu vào database.");
      await Promise.all([loadCategories(page), loadParentOptions()]);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Không thể thêm danh mục.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: AdminCategory) {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!window.confirm(`Xóa danh mục \"${category.name}\"?`)) {
      return;
    }

    setDeletingCategoryId(category.id);

    try {
      await deleteAdminCategory(category.id);
      setSubmitSuccess("Đã xóa danh mục khỏi database.");

      const shouldStepBack =
        categoriesState.status === "ready" && categoriesState.categories.length === 1 && page > 1;
      const nextPage = shouldStepBack ? page - 1 : page;
      if (shouldStepBack) {
        setPage(nextPage);
      }
      await Promise.all([loadCategories(nextPage), loadParentOptions()]);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Không thể xóa danh mục.";
      setSubmitError(message);
    } finally {
      setDeletingCategoryId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Catalog</p>
          <h1 className="mt-3 text-4xl leading-tight text-emerald-950">Danh mục</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900/75">
            Thêm hoặc xóa danh mục sản phẩm qua API quản trị. Dữ liệu được lưu trực tiếp ở backend/database.
          </p>
        </div>

        <form className="grid min-w-0 gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-emerald-900">
            <span className="font-medium">Tên danh mục</span>
            <input
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 outline-none"
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Ví dụ: Thuốc điều trị Lupus"
              value={formState.name}
            />
          </label>

          <label className="grid gap-2 text-sm text-emerald-900">
            <span className="font-medium">Slug</span>
            <input
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 outline-none"
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="thuoc-dieu-tri-lupus"
              value={formState.slug}
            />
          </label>

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm text-emerald-900">
              <span className="font-medium">Danh mục cha</span>
              <select
                className="h-12 w-full min-w-0 rounded-2xl border border-emerald-200 bg-white px-4 outline-none"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    parent_id: event.target.value || null,
                  }))
                }
                value={formState.parent_id ?? ""}
              >
                <option value="">Không có</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 text-sm text-emerald-900">
              <span className="font-medium">Thứ tự sắp xếp</span>
              <input
                className="h-12 w-full min-w-0 rounded-2xl border border-emerald-200 bg-white px-4 outline-none"
                min="0"
                inputMode="numeric"
                step="1"
                type="number"
                onChange={(event) => setFormState((current) => ({ ...current, sort_order: event.target.value }))}
                value={formState.sort_order}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-emerald-900">
            <span className="font-medium">Mô tả</span>
            <textarea
              className="min-h-28 rounded-2xl border border-emerald-200 bg-white px-4 py-3 outline-none"
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              placeholder="Mô tả ngắn cho danh mục..."
              value={formState.description}
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-emerald-900">
            <input
              checked={formState.is_active}
              className="h-4 w-4 accent-emerald-700"
              onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
              type="checkbox"
            />
            <span>Kích hoạt ngay sau khi tạo</span>
          </label>

          <button
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang lưu..." : "Thêm danh mục"}
          </button>
        </form>
      </section>

      {submitError ? <StatePanel message={submitError} tone="error" /> : null}
      {submitSuccess ? <StatePanel message={submitSuccess} tone="success" /> : null}
      {categoriesState.status === "loading" ? <StatePanel message="Đang tải danh mục..." /> : null}
      {categoriesState.status === "error" ? <StatePanel message={categoriesState.error} tone="error" /> : null}

      {categoriesState.status === "ready" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
            {categoriesState.categories.length === 0 ? (
              <div className="p-6 text-sm text-emerald-900/75">Chưa có danh mục nào.</div>
            ) : (
              categoriesState.categories.map((category) => (
                <CategoryRow
                  category={category}
                  isDeleting={deletingCategoryId === category.id}
                  key={category.id}
                  onDelete={handleDelete}
                  parentName={category.parent_id ? parentNameById.get(category.parent_id) ?? null : null}
                />
              ))
            )}
          </section>
          <PaginationControls meta={categoriesState.meta} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function CategoryRow({
  category,
  isDeleting,
  onDelete,
  parentName,
}: {
  category: AdminCategory;
  isDeleting: boolean;
  onDelete: (category: AdminCategory) => void;
  parentName: string | null;
}) {
  return (
    <article className="grid gap-4 border-b border-emerald-50 p-5 last:border-b-0 xl:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl text-emerald-950">{category.name}</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
            {category.is_active ? "Đang hoạt động" : "Tạm ẩn"}
          </span>
        </div>
        <p className="mt-2 text-sm text-emerald-900/75">/{category.slug}</p>
        <p className="mt-2 text-sm text-emerald-900/75">Danh mục cha: {parentName ?? "Không có"}</p>
        {category.description ? <p className="mt-2 text-sm text-emerald-800">{category.description}</p> : null}
        <p className="mt-2 text-sm text-emerald-900/75">{category.classification.guidance}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
        <button
          className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-60"
          disabled={isDeleting}
          onClick={() => onDelete(category)}
          type="button"
        >
          {isDeleting ? "Đang xóa..." : "Xóa"}
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
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-emerald-900/75">
        Trang {meta.page} / {meta.total_pages || 1} · {meta.total} danh mục
      </p>
      <div className="flex gap-3">
        <button
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800 disabled:text-emerald-600"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
          type="button"
        >
          Trước
        </button>
        <button
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-800 disabled:text-emerald-600"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
          type="button"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function StatePanel({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "error" | "success";
}) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : tone === "success"
        ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
        : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";

  return <div className={className}>{message}</div>;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
