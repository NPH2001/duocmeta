import type { Metadata } from "next";

import { ProductsIndexPage } from "features/products/ProductsIndexPage";
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
  return <ProductsIndexPage />;
}
