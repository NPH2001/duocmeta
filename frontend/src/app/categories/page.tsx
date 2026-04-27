import type { Metadata } from "next";
import Link from "next/link";

import { categories } from "features/categories/category-data";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Categories",
    description: "Browse Duocmeta product categories through an SEO-friendly storefront index.",
    path: "/categories",
  });
}

export default function CategoriesIndexRoute() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 md:py-16">
      <section className="space-y-5 border-b border-stone-200 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
          Categories
        </p>
        <h1 className="max-w-4xl text-4xl leading-tight text-stone-950 md:text-6xl">
          Browse product categories.
        </h1>
        <p className="max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
          This index gives public category routes a crawler-friendly entry point while catalog APIs are still being built.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.slug}
            className="flex min-h-72 flex-col justify-between rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)]"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                {category.productCount} products
              </p>
              <h2 className="mt-6 text-2xl leading-tight text-stone-950">{category.name}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{category.description}</p>
            </div>
            <Link
              href={`/categories/${category.slug}`}
              className="mt-8 w-fit rounded-full bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
            >
              View Category
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
