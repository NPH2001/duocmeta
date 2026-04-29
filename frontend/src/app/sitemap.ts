import type { MetadataRoute } from "next";

import { categories } from "features/categories/category-data";
import { products } from "features/products/product-data";
import { fetchPublicPosts } from "lib/cms";
import { isIndexableRobotsDirective, siteUrl } from "lib/seo";

export const revalidate = 300;

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes: Array<Pick<SitemapEntry, "changeFrequency" | "priority"> & { path: string }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.8 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "daily", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = [
    ...staticRoutes.map((route) => toEntry(route.path, route)),
    ...products.map((product) =>
      toEntry(`/products/${product.slug}`, {
        changeFrequency: "weekly",
        priority: 0.7,
      })
    ),
    ...categories.map((category) =>
      toEntry(`/categories/${category.slug}`, {
        changeFrequency: "weekly",
        priority: 0.65,
      })
    ),
    ...(await getPostEntries()),
  ];

  return dedupeEntries(entries);
}

async function getPostEntries(): Promise<SitemapEntry[]> {
  try {
    const posts = await fetchPublicPosts({ page: 1, pageSize: 100 });

    return posts.data
      .filter((post) => isIndexableRobotsDirective(post.seo?.robots))
      .map((post) =>
        toEntry(`/blog/${post.slug}`, {
          changeFrequency: "weekly",
          lastModified: post.published_at,
          priority: 0.6,
        })
      );
  } catch {
    return [];
  }
}

function toEntry(path: string, input: Omit<SitemapEntry, "url">): SitemapEntry {
  return {
    url: new URL(path, siteUrl).toString(),
    ...input,
  };
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false;
    }

    seen.add(entry.url);
    return true;
  });
}
