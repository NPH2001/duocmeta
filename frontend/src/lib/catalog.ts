import { publicCatalogCacheTag, publicCatalogRevalidateSeconds } from "lib/cache";
import { buildMediaUrlFromStorageKey } from "lib/media";

export type PublicCategoryListItem = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type PublicCategoryBreadcrumb = {
  label: string;
  path: string;
};

export type PublicCategoryDetail = PublicCategoryListItem & {
  children: PublicCategoryListItem[];
  breadcrumbs: PublicCategoryBreadcrumb[];
};

export type PublicProductListItem = {
  id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  is_featured: boolean;
  currency_code: string;
  min_price: string | null;
  max_price: string | null;
  published_at: string | null;
  primary_image: {
    id: string;
    filename: string;
    width: number | null;
    height: number | null;
    alt_text: string | null;
    storage_key: string;
  } | null;
};

export type PublicProductBrand = {
  id: string;
  name: string;
  slug: string;
};

export type PublicProductCategory = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
};

export type PublicProductImage = {
  id: string;
  media_id: string;
  variant_id: string | null;
  filename: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  storage_key: string;
  sort_order: number;
  is_primary: boolean;
};

export type PublicProductVariantAttributeValue = {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  value_id: string;
  value_code: string;
  display_value: string;
};

export type PublicProductVariant = {
  id: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  weight_grams: number | null;
  image_media_id: string | null;
  attributes: PublicProductVariantAttributeValue[];
};

export type PublicProductAttributeValue = {
  id: string;
  value_code: string;
  display_value: string;
  sort_order: number;
};

export type PublicProductAttribute = {
  id: string;
  code: string;
  name: string;
  input_type: string;
  is_filterable: boolean;
  is_variant_axis: boolean;
  values: PublicProductAttributeValue[];
};

export type PublicProductBreadcrumb = {
  label: string;
  path: string;
};

export type PublicProductSeo = {
  title: string;
  description: string | null;
  canonical_path: string;
};

export type PublicProductDetail = {
  id: string;
  brand: PublicProductBrand | null;
  categories: PublicProductCategory[];
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  product_type: string;
  default_variant_id: string | null;
  is_featured: boolean;
  currency_code: string;
  min_price: string | null;
  max_price: string | null;
  published_at: string;
  images: PublicProductImage[];
  variants: PublicProductVariant[];
  attributes: PublicProductAttribute[];
  breadcrumbs: PublicProductBreadcrumb[];
  seo: PublicProductSeo;
};

export type CatalogPaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type CatalogEnvelope<T> = {
  data: T | null;
  meta: CatalogPaginationMeta | Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

export async function fetchPublicCategories(input: { page?: number; pageSize?: number } = {}) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const response = await catalogRequest<PublicCategoryListItem[]>(`/categories?page=${page}&page_size=${pageSize}`);

  return {
    data: response.data ?? [],
    meta: response.meta as CatalogPaginationMeta,
  };
}

export async function fetchPublicCategory(slug: string): Promise<PublicCategoryDetail | null> {
  const response = await catalogRequest<PublicCategoryDetail>(`/categories/${encodeURIComponent(slug)}`, {
    notFoundAsNull: true,
  });

  return response.data;
}

export async function fetchPublicProducts(
  input: {
    q?: string;
    categorySlug?: string;
    brandSlug?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc";
    page?: number;
    pageSize?: number;
  } = {}
) {
  const params = new URLSearchParams();
  params.set("page", String(input.page ?? 1));
  params.set("page_size", String(input.pageSize ?? 20));

  if (input.q) params.set("q", input.q);
  if (input.categorySlug) params.set("category_slug", input.categorySlug);
  if (input.brandSlug) params.set("brand_slug", input.brandSlug);
  if (input.minPrice) params.set("min_price", input.minPrice);
  if (input.maxPrice) params.set("max_price", input.maxPrice);
  if (input.sort) params.set("sort", input.sort);

  const response = await catalogRequest<PublicProductListItem[]>(`/products?${params.toString()}`);

  return {
    data: response.data ?? [],
    meta: response.meta as CatalogPaginationMeta,
  };
}

export async function fetchPublicProduct(slug: string): Promise<PublicProductDetail | null> {
  const response = await catalogRequest<PublicProductDetail>(`/products/${encodeURIComponent(slug)}`, {
    notFoundAsNull: true,
  });

  return response.data;
}

export async function fetchPublicCategorySlugs(): Promise<string[]> {
  try {
    const response = await fetchPublicCategories({ page: 1, pageSize: 100 });
    return response.data.map((category) => category.slug);
  } catch {
    return [];
  }
}

export async function fetchPublicProductSlugs(): Promise<string[]> {
  try {
    const response = await fetchPublicProducts({ page: 1, pageSize: 100, sort: "newest" });
    return response.data.map((product) => product.slug);
  } catch {
    return [];
  }
}

export function buildPublicMediaUrl(storageKey: string): string {
  return buildMediaUrlFromStorageKey(storageKey, mediaBaseUrl);
}

async function catalogRequest<T>(
  path: string,
  options: {
    notFoundAsNull?: boolean;
  } = {}
): Promise<CatalogEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: publicCatalogRevalidateSeconds, tags: [publicCatalogCacheTag] },
  });
  const payload = (await response.json()) as CatalogEnvelope<T>;

  if (response.status === 404 && options.notFoundAsNull) {
    return { data: null, meta: {}, error: null };
  }

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Catalog request failed.");
  }

  return payload;
}
