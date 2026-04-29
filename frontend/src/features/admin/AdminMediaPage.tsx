"use client";

import { useState } from "react";

import { AdminMediaUploader } from "features/admin/AdminMediaUploader";
import type { AdminMedia } from "lib/admin";

export function AdminMediaPage() {
  const [lastMedia, setLastMedia] = useState<AdminMedia | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Media</p>
        <h1 className="mt-3 text-4xl leading-tight text-stone-950">Upload media</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Uploads use backend presign and completion APIs. Stored media metadata and IDs remain backend-owned.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <AdminMediaUploader onUploaded={setLastMedia} />
        </div>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Latest Upload</p>
          {lastMedia ? (
            <dl className="mt-4 space-y-3 text-sm text-stone-700">
              <MediaDetail label="Media ID" value={lastMedia.id} />
              <MediaDetail label="Filename" value={lastMedia.filename} />
              <MediaDetail label="Storage key" value={lastMedia.storage_key} />
              <MediaDetail label="MIME type" value={lastMedia.mime_type} />
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Uploaded media details will appear here after completion.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}

function MediaDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs text-stone-950">{value}</dd>
    </div>
  );
}
