import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "components/seo/JsonLd";
import { CategoryListingPage } from "features/categories/CategoryListingPage";
import { fetchPublicCategory, fetchPublicCategorySlugs, fetchPublicProducts } from "lib/catalog";
import { breadcrumbJsonLd, buildPublicMetadata } from "lib/seo";

type CategoryRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await fetchPublicCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchPublicCategory(slug);

  if (!category) {
    return buildPublicMetadata({
      title: "Không tìm thấy danh mục",
      path: `/categories/${slug}`,
    });
  }

  return buildPublicMetadata({
    title: category.name,
    description: category.description ?? `Duyệt sản phẩm trong danh mục ${category.name}.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const [category, productsResult] = await Promise.all([
    fetchPublicCategory(slug),
    fetchPublicProducts({ categorySlug: slug, page: 1, pageSize: 100, sort: "newest" }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      <CategoryListingPage category={category} products={productsResult.data} productsMeta={productsResult.meta} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Danh mục", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
    </>
  );
}
