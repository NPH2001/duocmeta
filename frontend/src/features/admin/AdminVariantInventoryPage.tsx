"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { InventoryPreparationPanel } from "features/admin/AdminVariantFormPage";
import { fetchAdminVariant, type AdminVariant } from "lib/admin";

type InventoryState =
  | { status: "loading"; variant: null; error: null }
  | { status: "ready"; variant: AdminVariant; error: null }
  | { status: "error"; variant: null; error: string };

export function AdminVariantInventoryPage({ variantId }: { variantId: string }) {
  const [inventoryState, setInventoryState] = useState<InventoryState>({
    status: "loading",
    variant: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    fetchAdminVariant(variantId)
      .then((variant) => {
        if (isMounted) {
          setInventoryState({ status: "ready", variant, error: null });
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Could not load variant.";
          setInventoryState({ status: "error", variant: null, error: message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [variantId]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Tồn kho
          </p>
          <h1 className="mt-3 break-words text-4xl leading-tight text-emerald-950">
            {inventoryState.status === "ready" ? inventoryState.variant.sku : variantId}
          </h1>
        </div>
        <Link
          href="/admin/variants"
          className="inline-flex h-fit justify-center rounded-full border border-emerald-300 px-5 py-3 text-sm"
        >
          Quay lại phiên bản
        </Link>
      </section>

      {inventoryState.status === "loading" ? <StatePanel message="Loading inventory shell..." /> : null}
      {inventoryState.status === "error" ? <StatePanel message={inventoryState.error} tone="error" /> : null}

      {inventoryState.status === "ready" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-emerald-100 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Variant
            </p>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <InventoryField label="SKU" value={inventoryState.variant.sku} />
              <InventoryField label="Trạng thái" value={inventoryState.variant.status} />
              <InventoryField label="Giá" value={inventoryState.variant.price} />
              <InventoryField label="Sản phẩm ID" value={inventoryState.variant.product_id} />
            </dl>
          </section>
          <InventoryPreparationPanel />
        </div>
      ) : null}
    </div>
  );
}

function InventoryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{label}</dt>
      <dd className="mt-2 break-words text-sm text-emerald-950">{value}</dd>
    </div>
  );
}

function StatePanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      : "rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-900/75";

  return <div className={className}>{message}</div>;
}
