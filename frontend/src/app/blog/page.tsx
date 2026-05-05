import type { Metadata } from "next";

import { BlogListingPage } from "features/blog/BlogPages";
import { fetchPublicPosts } from "lib/cms";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Bài viết",
    description: "Đọc các bài viết sức khỏe và nhà thuốc đã xuất bản của Duocmeta.",
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
        errorMessage="Chưa thể kết nối CMS API. Bài viết đã xuất bản sẽ hiển thị tại đây khi API sẵn sàng."
        posts={{
          data: [],
          meta: { page: 1, page_size: 12, total: 0, total_pages: 0 },
        }}
      />
    );
  }
}
