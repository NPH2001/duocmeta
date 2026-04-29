import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "components/seo/JsonLd";
import { ContentPage } from "features/content/ContentPage";
import { fetchPublicPage, type PublicPageDetail } from "lib/cms";
import { breadcrumbJsonLd, buildPublicMetadata, parseRobotsDirective, siteName, siteUrl } from "lib/seo";

type ContentRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: ContentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublicPage(slug);

  if (!page) {
    return buildPublicMetadata({
      title: "Page Not Found",
      path: `/pages/${slug}`,
    });
  }

  const title = page.seo?.meta_title ?? page.seo?.og_title ?? page.title;
  const description = page.seo?.meta_description ?? page.seo?.og_description ?? undefined;
  const canonicalPath = page.seo?.canonical_url ?? `/pages/${page.slug}`;
  const metadata = buildPublicMetadata({
    title,
    description,
    path: canonicalPath,
  });

  return {
    ...metadata,
    robots: parseRobotsDirective(page.seo?.robots) ?? metadata.robots,
    openGraph: {
      ...metadata.openGraph,
      title: page.seo?.og_title ?? metadata.openGraph?.title,
      description: page.seo?.og_description ?? metadata.openGraph?.description,
      type: "article",
      publishedTime: page.published_at,
    },
  };
}

export default async function ContentRoute({ params }: ContentRouteProps) {
  const { slug } = await params;
  const page = await fetchPublicPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      <ContentPage page={page} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: page.title, path: `/pages/${page.slug}` },
        ])}
      />
      <JsonLd data={webPageJsonLd(page)} />
      {page.seo?.schema_json ? <JsonLd data={page.seo.schema_json} /> : null}
    </>
  );
}

function webPageJsonLd(page: PublicPageDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    datePublished: page.published_at,
    dateModified: page.published_at,
    url: new URL(`/pages/${page.slug}`, siteUrl).toString(),
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}
