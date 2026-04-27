import type { Metadata } from "next";
import Link from "next/link";

import { products } from "features/products/product-data";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Products",
    description: "Browse Duocmeta products through an SEO-friendly storefront index.",
    path: "/products",
  });
}

export default function ProductsIndexRoute() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <section className="space-y-5 border-b border-stone-200 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
          Products
        </p>
        <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">
          Browse product detail pages.
        </h1>
        <p className="max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
          Static product previews keep public routes indexable while live catalog APIs are still being built.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.slug}
            className="flex min-h-80 flex-col justify-between rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                {product.brand}
              </p>
              <h2 className="mt-6 text-2xl leading-tight text-stone-950">{product.name}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{product.summary}</p>
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="mt-8 w-fit rounded-full bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
            >
              View Product
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
