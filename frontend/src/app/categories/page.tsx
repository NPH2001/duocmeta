import type { Metadata } from "next";

import { CategoriesIndexPage } from "features/categories/CategoriesIndexPage";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Danh mục",
    description: "Duyệt danh mục sản phẩm Duocmeta qua trang tối ưu SEO.",
    path: "/categories",
  });
}

export default function CategoriesIndexRoute() {
  return <CategoriesIndexPage />;
}
