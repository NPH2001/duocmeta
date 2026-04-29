import type { Metadata } from "next";

import { BlogListingPage } from "features/blog/BlogPages";
import { fetchPublicPosts } from "lib/cms";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Journal",
    description: "Read published Duocmeta health and pharmacy notes.",
    path: "/blog",
  });
}

export default async function BlogIndexRoute() {
  try {
    const posts = await fetchPublicPosts({ page: 1, pageSize: 12 });

    return <BlogListingPage posts={posts} />;
  } catch {
    return (
      <BlogListingPage
        errorMessage="The CMS API could not be reached. Published posts will appear here after the API is available."
        posts={{
          data: [],
          meta: { page: 1, page_size: 12, total: 0, total_pages: 0 },
        }}
      />
    );
  }
}
