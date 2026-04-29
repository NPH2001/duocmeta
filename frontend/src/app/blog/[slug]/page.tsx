import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "components/seo/JsonLd";
import { BlogDetailPage } from "features/blog/BlogPages";
import { fetchPublicPost, fetchPublicPosts, type PublicPostDetail } from "lib/cms";
import { breadcrumbJsonLd, buildPublicMetadata, parseRobotsDirective, siteName, siteUrl } from "lib/seo";

type BlogPostRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const posts = await fetchPublicPosts({ page: 1, pageSize: 100 });
    return posts.data.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicPost(slug);

  if (!post) {
    return buildPublicMetadata({
      title: "Post Not Found",
      path: `/blog/${slug}`,
    });
  }

  const title = post.seo?.meta_title ?? post.seo?.og_title ?? post.title;
  const description = post.seo?.meta_description ?? post.seo?.og_description ?? post.summary ?? undefined;
  const canonicalPath = post.seo?.canonical_url ?? `/blog/${post.slug}`;
  const metadata = buildPublicMetadata({
    title,
    description,
    path: canonicalPath,
  });

  return {
    ...metadata,
    robots: parseRobotsDirective(post.seo?.robots) ?? metadata.robots,
    openGraph: {
      ...metadata.openGraph,
      title: post.seo?.og_title ?? metadata.openGraph?.title,
      description: post.seo?.og_description ?? metadata.openGraph?.description,
      type: "article",
      publishedTime: post.published_at,
    },
  };
}

export default async function BlogPostRoute({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  const post = await fetchPublicPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <BlogDetailPage post={post} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd data={articleJsonLd(post)} />
      {post.seo?.schema_json ? <JsonLd data={post.seo.schema_json} /> : null}
    </>
  );
}

function articleJsonLd(post: PublicPostDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary ?? post.seo?.meta_description ?? undefined,
    datePublished: post.published_at,
    dateModified: post.published_at,
    mainEntityOfPage: new URL(`/blog/${post.slug}`, siteUrl).toString(),
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}
