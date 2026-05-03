import type { Metadata } from "next";

import { CategoriesIndexPage } from "features/categories/CategoriesIndexPage";
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
  return <CategoriesIndexPage />;
}
