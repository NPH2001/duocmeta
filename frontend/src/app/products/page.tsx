import type { Metadata } from "next";

import { ProductsIndexPage } from "features/products/ProductsIndexPage";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Sản phẩm",
    description: "Duyệt sản phẩm Duocmeta qua trang danh sách tối ưu SEO.",
    path: "/products",
  });
}

export default function ProductsIndexRoute() {
  return <ProductsIndexPage />;
}
