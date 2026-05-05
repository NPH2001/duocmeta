import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "components/seo/JsonLd";
import { ProductDetailPage } from "features/products/ProductDetailPage";
import { getProductBySlug, products } from "features/products/product-data";
import { breadcrumbJsonLd, buildPublicMetadata } from "lib/seo";

type ProductRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 3600;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return buildPublicMetadata({
      title: "Không tìm thấy sản phẩm",
      path: `/products/${slug}`,
    });
  }

  return buildPublicMetadata({
    title: product.seoTitle,
    description: product.seoDescription,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductDetailPage product={product} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Sản phẩm", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
    </>
  );
}
