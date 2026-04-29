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
  pages: { title: "", slug: "", status: "draft", publishedAt: "", content: "{\n  \"blocks\": []\n}" },
  posts: {
    title: "",
    slug: "",
    summary: "",
    status: "draft",
    publishedAt: "",
    tagIds: "",
    content: "{\n  \"blocks\": []\n}",
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
  pages: { singular: "page", listHref: "/admin/cms/pages" },
  posts: { singular: "post", listHref: "/admin/cms/posts" },
  seo: { singular: "SEO metadata", listHref: "/admin/cms/seo" },
  redirects: { singular: "redirect", listHref: "/admin/cms/redirects" },
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
          const message = caughtError instanceof Error ? caughtError.message : `Could not load ${label.singular}.`;
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

    try {
      const resource = await saveResource(kind, mode, id, formState);
      router.push(`${label.listHref}/${resource.id}/edit`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : `${label.singular} save failed.`;
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
      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">CMS</p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950">
            {mode === "create" ? "Create" : "Edit"} {label.singular}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            This form submits definitions to backend admin CMS APIs; publication, metadata, and
            redirect rules remain backend-owned.
          </p>
        </div>
        <Link className="inline-flex h-fit justify-center rounded-full border border-stone-300 px-5 py-3 text-sm" href={label.listHref}>
          Back
        </Link>
      </section>

      {loadState.status === "loading" ? <StatePanel message="Loading form..." /> : null}
      {loadState.status === "error" ? <StatePanel message={loadState.error} tone="error" /> : null}
      {loadState.status === "ready" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">{renderFields(kind, formState, updateField)}</div>
          </section>
          <aside className="flex flex-col gap-5">
            {kind === "seo" ? (
              <AdminMediaUploader
                label="Open Graph image"
                onUploaded={(media) => updateField("ogImageMediaId", media.id)}
              />
            ) : null}
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Authority</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                The backend validates slug uniqueness, publication state, SEO entity ownership, and
                redirect status codes.
              </p>
            </section>
            {submitError ? <StatePanel message={submitError} tone="error" /> : null}
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:bg-stone-400" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
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
        <TextField label="From path" required value={String(state.fromPath)} onChange={(value) => updateField("fromPath", value)} />
        <TextField label="To path" required value={String(state.toPath)} onChange={(value) => updateField("toPath", value)} />
        <TextField label="Status code" required type="number" value={String(state.statusCode)} onChange={(value) => updateField("statusCode", value)} />
        <CheckField label="Active redirect" checked={Boolean(state.isActive)} onChange={(value) => updateField("isActive", value)} />
      </>
    );
  }

  if (kind === "seo") {
    return (
      <>
        <TextField label="Entity type" required value={String(state.entityType)} onChange={(value) => updateField("entityType", value)} />
        <TextField label="Entity ID" required value={String(state.entityId)} onChange={(value) => updateField("entityId", value)} />
        <TextField label="Meta title" value={String(state.metaTitle)} onChange={(value) => updateField("metaTitle", value)} />
        <TextField label="Meta description" value={String(state.metaDescription)} onChange={(value) => updateField("metaDescription", value)} />
        <TextField label="Canonical URL" value={String(state.canonicalUrl)} onChange={(value) => updateField("canonicalUrl", value)} />
        <TextField label="Robots" value={String(state.robots)} onChange={(value) => updateField("robots", value)} />
        <TextField label="OG title" value={String(state.ogTitle)} onChange={(value) => updateField("ogTitle", value)} />
        <TextField label="OG description" value={String(state.ogDescription)} onChange={(value) => updateField("ogDescription", value)} />
        <TextField label="OG image media ID" value={String(state.ogImageMediaId)} onChange={(value) => updateField("ogImageMediaId", value)} />
        <JsonField label="Schema JSON" value={String(state.schemaJson)} onChange={(value) => updateField("schemaJson", value)} />
      </>
    );
  }

  return (
    <>
      <TextField label="Title" required value={String(state.title)} onChange={(value) => updateField("title", value)} />
      <TextField label="Slug" required value={String(state.slug)} onChange={(value) => updateField("slug", value)} />
      {kind === "posts" ? (
        <>
          <TextField label="Summary" value={String(state.summary)} onChange={(value) => updateField("summary", value)} />
          <TextField label="Tag IDs comma-separated" value={String(state.tagIds)} onChange={(value) => updateField("tagIds", value)} />
        </>
      ) : null}
      <SelectField label="Status" value={String(state.status)} onChange={(value) => updateField("status", value)} />
      <TextField label="Published at" type="datetime-local" value={String(state.publishedAt)} onChange={(value) => updateField("publishedAt", value)} />
      <JsonField label="Content JSON" value={String(state.content)} onChange={(value) => updateField("content", value)} />
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

async function saveResource(kind: FormKind, mode: FormMode, id: string | undefined, state: FormState) {
  switch (kind) {
    case "pages": {
      const input = {
        title: String(state.title),
        slug: String(state.slug),
        content: parseJsonObject(String(state.content), "Content JSON"),
        status: String(state.status),
        published_at: dateTimeLocalToIsoOrNull(String(state.publishedAt)),
      };
      return mode === "create" ? createAdminPage(input) : updateAdminPage(id ?? "", input);
    }
    case "posts": {
      const input = {
        title: String(state.title),
        slug: String(state.slug),
        summary: emptyToNull(String(state.summary)),
        content: parseJsonObject(String(state.content), "Content JSON"),
        status: String(state.status),
        published_at: dateTimeLocalToIsoOrNull(String(state.publishedAt)),
        tag_ids: String(state.tagIds).split(",").map((value) => value.trim()).filter(Boolean),
      };
      return mode === "create" ? createAdminPost(input) : updateAdminPost(id ?? "", input);
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
      content: JSON.stringify(resource.content, null, 2),
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
      content: JSON.stringify(resource.content, null, 2),
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

function TextField({ label, onChange, required = false, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: "datetime-local" | "number" | "text"; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
      <input className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case text-stone-950" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
    </label>
  );
}

function JsonField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:col-span-2">
      {label}
      <textarea className="mt-3 min-h-56 w-full rounded-xl border border-stone-300 px-3 py-3 font-mono text-sm normal-case text-stone-950" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function SelectField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
      <select className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm normal-case text-stone-950" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
    </label>
  );
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4 text-sm">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className = tone === "error" ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" : "rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600";
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
