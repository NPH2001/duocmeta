import type { Metadata } from "next";

import { HomePage } from "features/home/HomePage";
import { fetchPublicCategories, fetchPublicProducts } from "lib/catalog";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Duocmeta",
    description: "Landing nhà thuốc trực tuyến Duocmeta với tư vấn rõ ràng, cẩm nang sức khỏe và quy trình mua hàng an toàn do backend xác thực.",
    path: "/",
  });
}

export default async function Page() {
  const [categoriesResult, latestProductsResult, featuredProductsResult] = await Promise.all([
    fetchPublicCategories({ page: 1, pageSize: 20 }).catch(() => ({ data: [], meta: null })),
    fetchPublicProducts({ page: 1, pageSize: 8, sort: "newest" }).catch(() => ({ data: [], meta: null })),
    fetchPublicProducts({ page: 1, pageSize: 100, sort: "newest" }).catch(() => ({ data: [], meta: null })),
  ]);

  return (
    <HomePage
      categories={categoriesResult.data}
      featuredProducts={featuredProductsResult.data.filter((product) => product.is_featured).slice(0, 8)}
      latestProducts={latestProductsResult.data}
    />
  );
}
