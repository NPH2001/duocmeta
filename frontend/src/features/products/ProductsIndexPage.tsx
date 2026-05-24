"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import { buildPublicMediaUrl, type PublicProductListItem } from "lib/catalog";

export function ProductsIndexPage({ products }: { products: PublicProductListItem[] }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <section className="space-y-5 border-b border-emerald-100 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">{t("products.kicker")}</p>
        <h1 className="max-w-4xl text-4xl leading-tight text-emerald-950 md:text-6xl">{t("products.title")}</h1>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.length > 0 ? (
          products.map((product) => (
            <article
              key={product.slug}
              className="flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-white/90 shadow-[0_18px_50px_rgba(6,78,59,0.07)]"
            >
              <Link href={`/products/${product.slug}`} className="relative block h-40 overflow-hidden bg-emerald-50">
                {product.primary_image ? (
                  <Image
                    alt={product.primary_image.alt_text ?? product.name}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
                    src={buildPublicMediaUrl(product.primary_image.storage_key)}
            unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-lime-50 to-white" />
                )}
                <div className="absolute inset-0 grid place-items-center text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {!product.primary_image ? (product.is_featured ? "Nổi bật" : "Sản phẩm") : null}
                </div>
              </Link>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{product.currency_code}</p>
                  <h2 className="mt-6 text-2xl leading-tight text-emerald-950">{product.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-emerald-900/75">
                    {product.short_description ?? "Sản phẩm đang được đọc trực tiếp từ catalog backend."}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-red-600">{formatPriceRange(product)}</span>
                  <Link
                    href={`/products/${product.slug}`}
                    className="rounded-full bg-emerald-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500"
                  >
                    {t("products.viewProduct")}
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 text-sm text-emerald-900/75">
            Chưa có sản phẩm công khai nào để hiển thị.
          </div>
        )}
      </section>
    </div>
  );
}

function formatPriceRange(product: Pick<PublicProductListItem, "currency_code" | "min_price" | "max_price">) {
  if (product.min_price === null && product.max_price === null) {
    return "Liên hệ nhà thuốc";
  }

  if (product.min_price === product.max_price || product.max_price === null) {
    return formatMoney(product.min_price ?? "0", product.currency_code);
  }

  return `${formatMoney(product.min_price ?? "0", product.currency_code)} - ${formatMoney(product.max_price, product.currency_code)}`;
}

function formatMoney(value: string, currencyCode: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
