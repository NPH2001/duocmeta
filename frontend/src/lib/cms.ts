export type PublicSeoMetadata = {
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_media_id: string | null;
  schema_json: Record<string, unknown> | null;
};

export type PublicPostListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published_at: string;
  tag_ids: string[];
  seo: PublicSeoMetadata | null;
};

export type PublicPostDetail = PublicPostListItem & {
  content: Record<string, unknown>;
};

export type PublicPageDetail = {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  published_at: string;
  seo: PublicSeoMetadata | null;
};

export type PaginatedPublicPosts = {
  data: PublicPostListItem[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

type CmsEnvelope<T> = {
  data: T | null;
  meta: PaginatedPublicPosts["meta"] | Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export async function fetchPublicPosts(input: { page?: number; pageSize?: number } = {}): Promise<PaginatedPublicPosts> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;
  const response = await cmsRequest<PublicPostListItem[]>(`/posts?page=${page}&page_size=${pageSize}`);

  return {
    data: response.data ?? [],
    meta: response.meta as PaginatedPublicPosts["meta"],
  };
}

export async function fetchPublicPost(slug: string): Promise<PublicPostDetail | null> {
  const response = await cmsRequest<PublicPostDetail>(`/posts/${encodeURIComponent(slug)}`, {
    notFoundAsNull: true,
  });

  return response.data;
}

export async function fetchPublicPage(slug: string): Promise<PublicPageDetail | null> {
  const response = await cmsRequest<PublicPageDetail>(`/pages/${encodeURIComponent(slug)}`, {
    notFoundAsNull: true,
  });

  return response.data;
}

async function cmsRequest<T>(
  path: string,
  options: {
    notFoundAsNull?: boolean;
  } = {}
): Promise<CmsEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });
  const payload = (await response.json()) as CmsEnvelope<T>;

  if (response.status === 404 && options.notFoundAsNull) {
    return { data: null, meta: {}, error: null };
  }

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "CMS request failed.");
  }

  return payload;
}
