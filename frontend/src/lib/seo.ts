import type { Metadata } from "next";

type MetadataInput = {
  title: string;
  description?: string | undefined;
  path: string;
  imagePath?: string | undefined;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8080";
export const siteName = "Duocmeta";
export const defaultDescription = "Production-grade ecommerce storefront foundation.";

const defaultOgImagePath = "/og-default.jpg";

export function buildPublicMetadata({
  title,
  description = defaultDescription,
  path,
  imagePath = defaultOgImagePath,
}: MetadataInput): Metadata {
  const url = new URL(path, siteUrl).toString();
  const imageUrl = new URL(imagePath, siteUrl).toString();
  const pageTitle = title === siteName ? siteName : `${title} | ${siteName}`;

  return {
    metadataBase: new URL(siteUrl),
    title: pageTitle,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${pageTitle} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteUrl).toString(),
    })),
  };
}
