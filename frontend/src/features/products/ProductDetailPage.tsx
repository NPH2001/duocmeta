import Link from "next/link";

import type { ProductDetail } from "./product-data";

type ProductDetailPageProps = {
  product: ProductDetail;
};

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-950">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/products" className="hover:text-stone-950">
          Products
        </Link>
        <span className="px-2">/</span>
        <Link href={`/categories/${product.categorySlug}`} className="hover:text-stone-950">
          {product.categoryName}
        </Link>
        <span className="px-2">/</span>
        <span className="text-stone-900">{product.name}</span>
      </nav>

      <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <div
            className={`flex aspect-[4/3] items-end rounded-3xl border border-white/70 bg-gradient-to-br ${product.imageTone} p-7 shadow-[0_28px_70px_rgba(28,25,23,0.08)]`}
            aria-label={`${product.name} product image placeholder`}
          >
            <div className="w-full rounded-2xl border border-white/80 bg-white/70 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                Product Gallery
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl leading-tight text-stone-950 md:text-6xl">
                {product.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {product.highlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-stone-200 bg-white/88 p-4">
                <p className="text-sm font-medium text-stone-800">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-8 rounded-3xl border border-stone-200 bg-white/90 p-7 shadow-[0_22px_60px_rgba(28,25,23,0.06)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                {product.badge}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                {product.brand}
              </span>
            </div>
            <h2 className="text-3xl leading-tight text-stone-950">{product.name}</h2>
            <p className="text-base leading-8 text-stone-600">{product.description}</p>
          </div>

          <div className="border-y border-stone-200 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Price
            </p>
            <p className="mt-3 text-2xl text-stone-950">{product.priceLabel}</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Final price, availability, coupon eligibility, and cart validation will be supplied by backend APIs.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              Variants
            </h3>
            <div className="grid gap-3">
              {product.variants.map((variant) => (
                <label
                  key={variant.id}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-700"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="variant"
                      defaultChecked={variant === product.variants[0]}
                      className="h-4 w-4 accent-emerald-700"
                    />
                    <span>
                      <span className="block font-medium text-stone-950">{variant.label}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {variant.sku}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium text-stone-950">{variant.priceLabel}</span>
                    <span className="text-xs text-stone-500">{variant.statusLabel}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled
              className="rounded-full bg-stone-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-stone-600"
            >
              Add to Cart
            </button>
            <Link
              href={`/categories/${product.categorySlug}`}
              className="rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-stone-700 hover:border-stone-950 hover:text-stone-950"
            >
              Back to Category
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white/88 p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Product Information
          </p>
          <h2 className="mt-5 text-3xl text-stone-950">Structured detail ready for catalog data.</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">{product.summary}</p>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            This page intentionally presents product content and selection UI only. Purchase authority remains
            with backend services for inventory, pricing, coupons, and checkout.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-stone-950 p-6 text-stone-100">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Backend Authority
          </p>
          <h2 className="mt-5 text-2xl leading-tight">No frontend-owned commerce rules.</h2>
          <p className="mt-4 text-sm leading-7 text-stone-300">
            The disabled cart action keeps the shell ready for FE-007/commerce integration without bypassing backend
            validation.
          </p>
        </article>
      </section>
    </div>
  );
}
