import type { Metadata } from "next";

import { ProductsIndexPage } from "features/products/ProductsIndexPage";
import { fetchPublicProducts } from "lib/catalog";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Sản phẩm",
    description: "Duyệt sản phẩm Duocmeta qua trang danh sách tối ưu SEO.",
    path: "/products",
  });
}

export default async function ProductsIndexRoute() {
  const products = await fetchPublicProducts({ page: 1, pageSize: 100, sort: "newest" }).catch(() => ({ data: [] }));
  return <ProductsIndexPage products={products.data} />;
}
