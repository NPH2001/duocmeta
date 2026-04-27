import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "components/seo/JsonLd";
import { CategoryListingPage } from "features/categories/CategoryListingPage";
import { categories, getCategoryBySlug } from "features/categories/category-data";
import { breadcrumbJsonLd, buildPublicMetadata } from "lib/seo";

type CategoryRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 3600;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return buildPublicMetadata({
      title: "Category Not Found",
      path: `/categories/${slug}`,
    });
  }

  return buildPublicMetadata({
    title: category.seoTitle,
    description: category.seoDescription,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <>
      <CategoryListingPage category={category} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
    </>
  );
}
