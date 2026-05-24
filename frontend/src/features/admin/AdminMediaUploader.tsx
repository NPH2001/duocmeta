"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";

import {
  completeAdminMediaUpload,
  createAdminMediaPresign,
  type AdminMedia,
  type AdminMediaPresign,
} from "lib/admin";

type AdminMediaUploaderProps = {
  label?: string;
  onUploaded: (media: AdminMedia) => void;
};

type UploadState =
  | { status: "idle"; message: null }
  | { status: "uploading"; message: string }
  | { status: "uploaded"; message: string }
  | { status: "error"; message: string };

export function AdminMediaUploader({ label = "Upload media", onUploaded }: AdminMediaUploaderProps) {
  const [altText, setAltText] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", message: null });
  const [lastMedia, setLastMedia] = useState<AdminMedia | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadState({ status: "uploading", message: "Preparing upload..." });
    setLastMedia(null);

    try {
      const presign = await createAdminMediaPresign({
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      setUploadState({ status: "uploading", message: "Uploading file..." });
      await uploadToPresignedTarget(file, presign);
      setUploadState({ status: "uploading", message: "Saving media metadata..." });

      const dimensions = file.type.startsWith("image/")
        ? await readImageDimensions(file)
        : { width: null, height: null };
      const media = await completeAdminMediaUpload({
        storage_key: presign.storage_key,
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        width: dimensions.width,
        height: dimensions.height,
        alt_text: altText.trim() || null,
      });

      setLastMedia(media);
      setUploadState({ status: "uploaded", message: `Uploaded ${media.filename}` });
      onUploaded(media);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Media upload failed.";
      setUploadState({ status: "error", message });
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{label}</p>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Alt text
        <input
          className="mt-2 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm normal-case text-emerald-950"
          onChange={(event) => setAltText(event.target.value)}
          placeholder="Describe the uploaded media"
          type="text"
          value={altText}
        />
      </label>
      <label className="mt-4 flex cursor-pointer justify-center rounded-full bg-emerald-600 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500">
        Choose File
        <input accept="image/*,application/pdf" className="sr-only" onChange={handleFileChange} type="file" />
      </label>
      {uploadState.message ? (
        <p className={uploadState.status === "error" ? "mt-3 text-sm text-red-700" : "mt-3 text-sm text-emerald-900/75"}>
          {uploadState.message}
        </p>
      ) : null}
      {lastMedia ? (
        <p className="mt-2 break-all text-xs text-emerald-700">
          Media ID: <span className="font-mono">{lastMedia.id}</span>
        </p>
      ) : null}
    </section>
  );
}

async function uploadToPresignedTarget(file: File, presign: AdminMediaPresign): Promise<void> {
  const response = await fetch(presign.upload_url, {
    body: file,
    headers: presign.headers,
    method: presign.method,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const normalizedDetail = detail.trim().slice(0, 200);
    throw new Error(
      normalizedDetail
        ? `Object storage upload failed (${response.status}): ${normalizedDetail}`
        : `Object storage upload failed (${response.status}).`
    );
  }
}

async function readImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    const loaded = new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Could not read image dimensions."));
    });
    image.src = objectUrl;
    return await loaded;
  } catch {
    return { width: null, height: null };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
