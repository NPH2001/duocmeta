"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { AdminMediaUploader } from "features/admin/AdminMediaUploader";
import {
  createAdminPage,
  createAdminPost,
  createAdminRedirect,
  createAdminSeoMetadata,
  fetchAdminPage,
  fetchAdminPost,
  fetchAdminRedirect,
  fetchAdminSeoMetadata,
  publishAdminPost,
  updateAdminPage,
  updateAdminPost,
  updateAdminRedirect,
  updateAdminSeoMetadata,
  type AdminPage,
  type AdminPost,
  type AdminRedirect,
  type AdminSeoMetadata,
} from "lib/admin";

type FormKind = "pages" | "posts" | "redirects" | "seo";
type FormMode = "create" | "edit";
type FormState = Record<string, string | boolean>;
type LoadedResource = AdminPage | AdminPost | AdminRedirect | AdminSeoMetadata | null;
type LoadState =
  | { status: "loading"; resource: null; error: null }
  | { status: "ready"; resource: LoadedResource; error: null }
  | { status: "error"; resource: null; error: string };

const defaults: Record<FormKind, FormState> = {
  pages: { title: "", slug: "", status: "draft", publishedAt: "", body: "" },
  posts: {
    title: "",
    slug: "",
    summary: "",
    status: "draft",
    publishedAt: "",
    tagIds: "",
    body: "",
  },
  seo: {
    entityType: "page",
    entityId: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    robots: "",
    ogTitle: "",
    ogDescription: "",
    ogImageMediaId: "",
    schemaJson: "",
  },
  redirects: { fromPath: "", toPath: "", statusCode: "301", isActive: true },
};

const labels: Record<FormKind, { singular: string; listHref: string }> = {
  pages: { singular: "trang", listHref: "/admin/cms/pages" },
  posts: { singular: "bài viết", listHref: "/admin/cms/posts" },
  seo: { singular: "metadata SEO", listHref: "/admin/cms/seo" },
  redirects: { singular: "chuyển hướng", listHref: "/admin/cms/redirects" },
};

export function AdminCmsFormPage({ id, kind, mode }: { id?: string; kind: FormKind; mode: FormMode }) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading", resource: null, error: null });
  const [formState, setFormState] = useState<FormState>(defaults[kind]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const label = labels[kind];

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (mode === "create") {
        setFormState(defaults[kind]);
        setLoadState({ status: "ready", resource: null, error: null });
        return;
      }

      try {
        const resource = await fetchResource(kind, id ?? "");
        if (isMounted) {
          setFormState(formStateFromResource(kind, resource));
          setLoadState({ status: "ready", resource, error: null });
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : `Không thể tải ${label.singular}.`;
          setLoadState({ status: "error", resource: null, error: message });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [id, kind, label.singular, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "publish" ? "publish" : "save";

    try {
      const resource = await saveResource(kind, mode, id, formState, intent);
      router.push(`${label.listHref}/${resource.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : `Không thể lưu ${label.singular}.`;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: string, value: string | boolean) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">CMS</p>
          <h1 className="mt-3 text-4xl leading-tight text-emerald-950">
            {mode === "create" ? "Thêm" : "Sửa"} {label.singular}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900/75">
            Biểu mẫu này gửi dữ liệu tới API quản trị CMS. Trạng thái đăng, metadata và
            quy tắc chuyển hướng vẫn được backend xác thực.
          </p>
        </div>
        <Link className="inline-flex h-fit justify-center rounded-full border border-emerald-300 px-5 py-3 text-sm" href={label.listHref}>
          Back
        </Link>
      </section>

      {loadState.status === "loading" ? <StatePanel message="Đang tải biểu mẫu..." /> : null}
      {loadState.status === "error" ? <StatePanel message={loadState.error} tone="error" /> : null}
      {loadState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-emerald-100 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">{renderFields(kind, formState, updateField)}</div>
          </section>
          <aside className="flex flex-col gap-5">
            {kind === "seo" ? (
              <AdminMediaUploader
                label="Ảnh Open Graph"
                onUploaded={(media) => updateField("ogImageMediaId", media.id)}
              />
            ) : null}
            <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Nguồn kiểm soát</p>
              <p className="mt-3 text-sm leading-6 text-emerald-900/75">
                Backend kiểm tra slug duy nhất, trạng thái đăng, quyền sở hữu SEO và
                mã trạng thái chuyển hướng.
              </p>
            </section>
            {kind === "posts" &&
            loadState.resource &&
            "slug" in loadState.resource &&
            loadState.resource.status === "published" ? (
              <Link
                className="rounded-full border border-emerald-300 px-5 py-3 text-center text-sm font-semibold text-emerald-800"
                href={`/blog/${loadState.resource.slug}`}
              >
                Xem bài đã đăng
              </Link>
            ) : null}
            {submitError ? <StatePanel message={submitError} tone="error" /> : null}
            <button className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500 disabled:bg-emerald-400" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : kind === "posts" ? "Lưu nháp" : "Lưu trang"}
            </button>
            {kind === "posts" ? (
              <button
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:bg-amber-300"
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="publish"
              >
                {isSubmitting ? "Đang đăng..." : "Đăng bài lên /blog"}
              </button>
            ) : null}
          </aside>
        </form>
      ) : null}
    </div>
  );
}

function renderFields(kind: FormKind, state: FormState, updateField: (field: string, value: string | boolean) => void) {
  if (kind === "redirects") {
    return (
      <>
        <TextField label="Đường dẫn nguồn" required value={String(state.fromPath)} onChange={(value) => updateField("fromPath", value)} />
        <TextField label="Đường dẫn đích" required value={String(state.toPath)} onChange={(value) => updateField("toPath", value)} />
        <TextField label="Mã trạng thái" required type="number" value={String(state.statusCode)} onChange={(value) => updateField("statusCode", value)} />
        <CheckField label="Chuyển hướng đang hoạt động" checked={Boolean(state.isActive)} onChange={(value) => updateField("isActive", value)} />
      </>
    );
  }

  if (kind === "seo") {
    return (
      <>
        <TextField label="Loại đối tượng" required value={String(state.entityType)} onChange={(value) => updateField("entityType", value)} />
        <TextField label="ID đối tượng" required value={String(state.entityId)} onChange={(value) => updateField("entityId", value)} />
        <TextField label="Tiêu đề meta" value={String(state.metaTitle)} onChange={(value) => updateField("metaTitle", value)} />
        <TextField label="Mô tả meta" value={String(state.metaDescription)} onChange={(value) => updateField("metaDescription", value)} />
        <TextField label="URL canonical" value={String(state.canonicalUrl)} onChange={(value) => updateField("canonicalUrl", value)} />
        <TextField label="Robots" value={String(state.robots)} onChange={(value) => updateField("robots", value)} />
        <TextField label="Tiêu đề OG" value={String(state.ogTitle)} onChange={(value) => updateField("ogTitle", value)} />
        <TextField label="Mô tả OG" value={String(state.ogDescription)} onChange={(value) => updateField("ogDescription", value)} />
        <TextField label="ID ảnh OG" value={String(state.ogImageMediaId)} onChange={(value) => updateField("ogImageMediaId", value)} />
        <JsonField label="JSON schema" value={String(state.schemaJson)} onChange={(value) => updateField("schemaJson", value)} />
      </>
    );
  }

  return (
    <>
      <TextField label="Tiêu đề" required value={String(state.title)} onChange={(value) => updateField("title", value)} />
      <TextField label="Slug" required value={String(state.slug)} onChange={(value) => updateField("slug", value)} />
      {kind === "posts" ? (
        <>
          <TextField label="Tóm tắt" value={String(state.summary)} onChange={(value) => updateField("summary", value)} />
          <TextField
            helpText="Không bắt buộc. Chỉ nhập UUID thẻ hợp lệ từ CMS Tags, ví dụ: 550e8400-e29b-41d4-a716-446655440000. Nếu chưa có thẻ, hãy để trống."
            label="ID thẻ, phân tách bằng dấu phẩy"
            value={String(state.tagIds)}
            onChange={(value) => updateField("tagIds", value)}
          />
        </>
      ) : null}
      <SelectField label="Trạng thái" value={String(state.status)} onChange={(value) => updateField("status", value)} />
      <TextField label="Ngày đăng" type="datetime-local" value={String(state.publishedAt)} onChange={(value) => updateField("publishedAt", value)} />
      {kind === "pages" || kind === "posts" ? (
        <BodyField
          label={kind === "posts" ? "Nội dung bài viết" : "Nội dung trang"}
          value={String(state.body)}
          onChange={(value) => updateField("body", value)}
        />
      ) : (
        <JsonField label="Nội dung JSON" value={String(state.content)} onChange={(value) => updateField("content", value)} />
      )}
    </>
  );
}

async function fetchResource(kind: FormKind, id: string) {
  switch (kind) {
    case "pages":
      return fetchAdminPage(id);
    case "posts":
      return fetchAdminPost(id);
    case "seo":
      return fetchAdminSeoMetadata(id);
    case "redirects":
      return fetchAdminRedirect(id);
  }
}

async function saveResource(
  kind: FormKind,
  mode: FormMode,
  id: string | undefined,
  state: FormState,
  intent: "publish" | "save"
) {
  switch (kind) {
    case "pages": {
      const input = {
        title: String(state.title),
        slug: String(state.slug),
        content: bodyToContentBlocks(String(state.body)),
        status: String(state.status),
        published_at: dateTimeLocalToIsoOrNull(String(state.publishedAt)),
      };
      return mode === "create" ? createAdminPage(input) : updateAdminPage(id ?? "", input);
    }
    case "posts": {
      const isPublishing = intent === "publish";
      const input = {
        title: String(state.title),
        slug: String(state.slug),
        summary: emptyToNull(String(state.summary)),
        content: bodyToContentBlocks(String(state.body)),
        status: isPublishing ? "published" : String(state.status),
        published_at: isPublishing
          ? dateTimeLocalToIsoOrNull(String(state.publishedAt)) ?? new Date().toISOString()
          : dateTimeLocalToIsoOrNull(String(state.publishedAt)),
        tag_ids: parseTagIds(String(state.tagIds)),
      };
      const resource = mode === "create" ? await createAdminPost(input) : await updateAdminPost(id ?? "", input);
      return isPublishing ? publishAdminPost(resource.id) : resource;
    }
    case "seo": {
      const input = {
        entity_type: String(state.entityType),
        entity_id: String(state.entityId),
        meta_title: emptyToNull(String(state.metaTitle)),
        meta_description: emptyToNull(String(state.metaDescription)),
        canonical_url: emptyToNull(String(state.canonicalUrl)),
        robots: emptyToNull(String(state.robots)),
        og_title: emptyToNull(String(state.ogTitle)),
        og_description: emptyToNull(String(state.ogDescription)),
        og_image_media_id: emptyToNull(String(state.ogImageMediaId)),
        schema_json: parseOptionalJsonObject(String(state.schemaJson), "Schema JSON"),
      };
      return mode === "create" ? createAdminSeoMetadata(input) : updateAdminSeoMetadata(id ?? "", input);
    }
    case "redirects": {
      const input = {
        from_path: String(state.fromPath),
        to_path: String(state.toPath),
        status_code: Number(state.statusCode),
        is_active: Boolean(state.isActive),
      };
      return mode === "create" ? createAdminRedirect(input) : updateAdminRedirect(id ?? "", input);
    }
  }
}

function formStateFromResource(kind: FormKind, resource: LoadedResource): FormState {
  if (kind === "pages" && resource && "title" in resource) {
    return {
      title: resource.title,
      slug: resource.slug,
      status: resource.status,
      publishedAt: isoToDateTimeLocal(resource.published_at),
      body: contentBlocksToBody(resource.content),
    };
  }
  if (kind === "posts" && resource && "summary" in resource) {
    return {
      title: resource.title,
      slug: resource.slug,
      summary: resource.summary ?? "",
      status: resource.status,
      publishedAt: isoToDateTimeLocal(resource.published_at),
      tagIds: resource.tag_ids.join(", "),
      body: contentBlocksToBody(resource.content),
    };
  }
  if (kind === "seo" && resource && "entity_type" in resource) {
    return {
      entityType: resource.entity_type,
      entityId: resource.entity_id,
      metaTitle: resource.meta_title ?? "",
      metaDescription: resource.meta_description ?? "",
      canonicalUrl: resource.canonical_url ?? "",
      robots: resource.robots ?? "",
      ogTitle: resource.og_title ?? "",
      ogDescription: resource.og_description ?? "",
      ogImageMediaId: resource.og_image_media_id ?? "",
      schemaJson: resource.schema_json ? JSON.stringify(resource.schema_json, null, 2) : "",
    };
  }
  if (kind === "redirects" && resource && "from_path" in resource) {
    return { fromPath: resource.from_path, toPath: resource.to_path, statusCode: String(resource.status_code), isActive: resource.is_active };
  }
  return defaults[kind];
}

function TextField({
  helpText,
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "datetime-local" | "number" | "text";
  value: string;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {label}
      <input className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
      {helpText ? (
        <span className="mt-2 block text-[11px] normal-case tracking-normal text-emerald-900/65">{helpText}</span>
      ) : null}
    </label>
  );
}

function JsonField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 md:col-span-2">
      {label}
      <textarea className="mt-3 min-h-56 w-full rounded-xl border border-emerald-300 px-3 py-3 font-mono text-sm normal-case text-emerald-950" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function BodyField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 md:col-span-2">
      {label}
      <textarea
        className="mt-3 min-h-80 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case leading-7 text-emerald-950"
        onChange={(event) => onChange(event.target.value)}
        placeholder={"Viết nội dung bài tại đây. Xuống dòng trống để tách đoạn. Dùng ## để tạo tiêu đề phụ, > để tạo trích dẫn, - để tạo danh sách."}
        value={value}
      />
      <span className="mt-2 block text-[11px] normal-case tracking-normal text-emerald-900/65">
        Hệ thống tự chuyển nội dung này thành content blocks để trang public hiển thị nhất quán. Không cần nhập JSON.
      </span>
    </label>
  );
}

function SelectField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {label}
      <select className="mt-3 w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm normal-case text-emerald-950" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="draft">Bản nháp</option>
        <option value="published">Đã đăng</option>
        <option value="archived">Đã lưu trữ</option>
      </select>
    </label>
  );
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-emerald-100 p-4 text-sm">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className = tone === "error" ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";
  return <div className={className}>{message}</div>;
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function parseOptionalJsonObject(value: string, label: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  return trimmed ? parseJsonObject(trimmed, label) : null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseTagIds(value: string): string[] {
  const tagIds = value
    .split(",")
    .map((tagId) => tagId.trim())
    .filter(Boolean);
  const invalidTagId = tagIds.find((tagId) => !uuidPattern.test(tagId));

  if (invalidTagId) {
    throw new Error(
      `ID thẻ không hợp lệ: "${invalidTagId}". Vui lòng nhập UUID hợp lệ được lấy từ CMS Tags hoặc để trống trường này.`
    );
  }

  return tagIds;
}

type ContentBlock =
  | { text: string; type: "heading" | "paragraph" | "quote" }
  | { items: string[]; type: "list" };

function bodyToContentBlocks(value: string): Record<string, unknown> {
  const sections = value
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
  const blocks: ContentBlock[] = sections.map((section) => {
    if (section.startsWith("## ")) {
      return { type: "heading", text: section.replace(/^##\s+/, "") };
    }
    if (section.startsWith("> ")) {
      return { type: "quote", text: section.replace(/^>\s+/, "") };
    }
    if (section.split("\n").every((line) => line.trim().startsWith("- "))) {
      return {
        type: "list",
        items: section
          .split("\n")
          .map((line) => line.replace(/^-\s+/, "").trim())
          .filter(Boolean),
      };
    }
    return { type: "paragraph", text: section.replace(/\n/g, " ") };
  });

  return { blocks };
}

function contentBlocksToBody(content: Record<string, unknown>): string {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];

  return blocks
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }
      const typedBlock = block as { items?: unknown; text?: unknown; type?: unknown };
      const text = typeof typedBlock.text === "string" ? typedBlock.text : "";

      if (typedBlock.type === "heading") {
        return `## ${text}`;
      }
      if (typedBlock.type === "quote") {
        return `> ${text}`;
      }
      if (typedBlock.type === "list" && Array.isArray(typedBlock.items)) {
        return typedBlock.items
          .filter((item): item is string => typeof item === "string")
          .map((item) => `- ${item}`)
          .join("\n");
      }
      return text;
    })
    .filter(Boolean)
    .join("\n\n");
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isoToDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16);
}

function dateTimeLocalToIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? new Date(trimmed).toISOString() : null;
}
