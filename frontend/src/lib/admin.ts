export class AdminApiError extends Error {
  statusCode: number;
  code: string | null;

  constructor(message: string, statusCode: number, code: string | null) {
    super(message);
    this.name = "AdminApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type AdminEnvelope<T> = {
  data: T | null;
  meta: Record<string, unknown>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

export type AdminPaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type AdminCategory = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  is_active: boolean;
};

export type AdminProduct = {
  id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  status: string;
  product_type: string;
  default_variant_id: string | null;
  is_featured: boolean;
  currency_code: string;
  min_price: string | null;
  max_price: string | null;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdminProductInput = {
  brand_id: string | null;
  category_ids?: string[];
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  product_type: string;
  is_featured: boolean;
  currency_code: string;
  min_price: string | null;
  max_price: string | null;
};

export type AdminVariant = {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  weight_grams: number | null;
  status: string;
  image_media_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminVariantInput = {
  product_id: string;
  sku: string;
  barcode: string | null;
  price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  weight_grams: number | null;
  status: string;
  image_media_id: string | null;
};

export type AdminOrderListItem = {
  id: string;
  order_code: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency_code: string;
  grand_total_amount: string;
  placed_at: string | null;
  created_at: string;
};

export type AdminOrderItem = {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string | null;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total_amount: string;
};

export type AdminOrderDetail = {
  id: string;
  order_code: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency_code: string;
  subtotal_amount: string;
  discount_amount: string;
  shipping_amount: string;
  tax_amount: string;
  grand_total_amount: string;
  placed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  items: AdminOrderItem[];
};

export type AdminCoupon = {
  id: string;
  code: string;
  name: string;
  discount_type: "fixed_amount" | "percent" | string;
  discount_value: string;
  min_order_value: string | null;
  max_discount_value: string | null;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminCouponInput = {
  code: string;
  name: string;
  discount_type: string;
  discount_value: string;
  min_order_value: string | null;
  max_discount_value: string | null;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type AdminPage = {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  status: string;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdminPageInput = {
  title: string;
  slug: string;
  content: Record<string, unknown>;
  status: string;
  published_at: string | null;
};

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: Record<string, unknown>;
  status: string;
  published_at: string | null;
  author_id: string | null;
  tag_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdminPostInput = {
  title: string;
  slug: string;
  summary: string | null;
  content: Record<string, unknown>;
  status: string;
  published_at: string | null;
  tag_ids: string[];
};

export type AdminSeoMetadata = {
  id: string;
  entity_type: string;
  entity_id: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_media_id: string | null;
  schema_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AdminSeoMetadataInput = {
  entity_type: string;
  entity_id: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_media_id: string | null;
  schema_json: Record<string, unknown> | null;
};

export type AdminRedirect = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  created_at: string;
};

export type AdminRedirectInput = {
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
};

export type AdminMedia = {
  id: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type AdminMediaPresignInput = {
  filename: string;
  mime_type: string;
  size_bytes: number;
};

export type AdminMediaPresign = {
  storage_key: string;
  bucket: string;
  upload_url: string;
  public_url: string;
  method: "PUT";
  headers: Record<string, string>;
  expires_at: string;
};

export type AdminMediaCompleteInput = {
  storage_key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
};

export type PaginatedAdminProducts = {
  data: AdminProduct[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminVariants = {
  data: AdminVariant[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminOrders = {
  data: AdminOrderListItem[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminCoupons = {
  data: AdminCoupon[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminPages = {
  data: AdminPage[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminPosts = {
  data: AdminPost[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminSeoMetadata = {
  data: AdminSeoMetadata[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminRedirects = {
  data: AdminRedirect[];
  meta: AdminPaginationMeta;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function verifyAdminAccess(accessToken: string): Promise<void> {
  await adminRequest<unknown>("/admin/brands?page=1&page_size=1", accessToken);
}

export async function fetchAdminProducts(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminProducts> {
  const response = await adminRequestWithStoredToken<AdminProduct[]>(
    `/admin/products?page=${input.page}&page_size=${input.pageSize}`
  );

  return {
    data: response.data ?? [],
    meta: response.meta as AdminPaginationMeta,
  };
}

export async function fetchAdminProduct(productId: string): Promise<AdminProduct> {
  const response = await adminRequestWithStoredToken<AdminProduct>(
    `/admin/products/${encodeURIComponent(productId)}`
  );

  if (response.data === null) {
    throw new Error("Product was not found.");
  }

  return response.data;
}

export async function createAdminProduct(input: AdminProductInput): Promise<AdminProduct> {
  const response = await adminRequestWithStoredToken<AdminProduct>("/admin/products", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Product could not be created.");
  }

  return response.data;
}

export async function updateAdminProduct(productId: string, input: AdminProductInput): Promise<AdminProduct> {
  const response = await adminRequestWithStoredToken<AdminProduct>(
    `/admin/products/${encodeURIComponent(productId)}`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    }
  );

  if (response.data === null) {
    throw new Error("Product could not be updated.");
  }

  return response.data;
}

export async function publishAdminProduct(productId: string): Promise<AdminProduct> {
  return adminProductMutation(`/admin/products/${encodeURIComponent(productId)}/publish`);
}

export async function archiveAdminProduct(productId: string): Promise<AdminProduct> {
  return adminProductMutation(`/admin/products/${encodeURIComponent(productId)}/archive`);
}

export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const response = await adminRequestWithStoredToken<AdminBrand[]>("/admin/brands?page=1&page_size=100");

  return response.data ?? [];
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const response = await adminRequestWithStoredToken<AdminCategory[]>(
    "/admin/categories?page=1&page_size=100"
  );

  return response.data ?? [];
}

export async function fetchAdminVariants(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminVariants> {
  const response = await adminRequestWithStoredToken<AdminVariant[]>(
    `/admin/variants?page=${input.page}&page_size=${input.pageSize}`
  );

  return {
    data: response.data ?? [],
    meta: response.meta as AdminPaginationMeta,
  };
}

export async function fetchAdminVariant(variantId: string): Promise<AdminVariant> {
  const response = await adminRequestWithStoredToken<AdminVariant>(
    `/admin/variants/${encodeURIComponent(variantId)}`
  );

  if (response.data === null) {
    throw new Error("Variant was not found.");
  }

  return response.data;
}

export async function createAdminVariant(input: AdminVariantInput): Promise<AdminVariant> {
  const response = await adminRequestWithStoredToken<AdminVariant>("/admin/variants", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Variant could not be created.");
  }

  return response.data;
}

export async function updateAdminVariant(variantId: string, input: AdminVariantInput): Promise<AdminVariant> {
  const response = await adminRequestWithStoredToken<AdminVariant>(
    `/admin/variants/${encodeURIComponent(variantId)}`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    }
  );

  if (response.data === null) {
    throw new Error("Variant could not be updated.");
  }

  return response.data;
}

export async function fetchAdminOrders(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminOrders> {
  const response = await adminRequestWithStoredToken<AdminOrderListItem[]>(
    `/admin/orders?page=${input.page}&page_size=${input.pageSize}`
  );

  return {
    data: response.data ?? [],
    meta: response.meta as AdminPaginationMeta,
  };
}

export async function fetchAdminOrder(orderCode: string): Promise<AdminOrderDetail> {
  const response = await adminRequestWithStoredToken<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(orderCode)}`
  );

  if (response.data === null) {
    throw new Error("Order was not found.");
  }

  return response.data;
}

export async function runAdminOrderWorkflow(
  orderCode: string,
  action: "cancel" | "confirm" | "deliver" | "refund" | "ship"
): Promise<AdminOrderDetail> {
  const response = await adminRequestWithStoredToken<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(orderCode)}/${action}`,
    { method: "POST" }
  );

  if (response.data === null) {
    throw new Error("Order workflow action failed.");
  }

  return response.data;
}

export async function fetchAdminCoupons(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminCoupons> {
  const response = await adminRequestWithStoredToken<AdminCoupon[]>(
    `/admin/coupons?page=${input.page}&page_size=${input.pageSize}`
  );

  return {
    data: response.data ?? [],
    meta: response.meta as AdminPaginationMeta,
  };
}

export async function fetchAdminCoupon(couponId: string): Promise<AdminCoupon> {
  const response = await adminRequestWithStoredToken<AdminCoupon>(
    `/admin/coupons/${encodeURIComponent(couponId)}`
  );

  if (response.data === null) {
    throw new Error("Coupon was not found.");
  }

  return response.data;
}

export async function createAdminCoupon(input: AdminCouponInput): Promise<AdminCoupon> {
  const response = await adminRequestWithStoredToken<AdminCoupon>("/admin/coupons", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Coupon could not be created.");
  }

  return response.data;
}

export async function updateAdminCoupon(couponId: string, input: AdminCouponInput): Promise<AdminCoupon> {
  const response = await adminRequestWithStoredToken<AdminCoupon>(
    `/admin/coupons/${encodeURIComponent(couponId)}`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    }
  );

  if (response.data === null) {
    throw new Error("Coupon could not be updated.");
  }

  return response.data;
}

export async function fetchAdminPages(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminPages> {
  const response = await adminRequestWithStoredToken<AdminPage[]>(
    `/admin/pages?page=${input.page}&page_size=${input.pageSize}`
  );

  return { data: response.data ?? [], meta: response.meta as AdminPaginationMeta };
}

export async function fetchAdminPage(pageId: string): Promise<AdminPage> {
  const response = await adminRequestWithStoredToken<AdminPage>(`/admin/pages/${encodeURIComponent(pageId)}`);

  if (response.data === null) {
    throw new Error("Page was not found.");
  }

  return response.data;
}

export async function createAdminPage(input: AdminPageInput): Promise<AdminPage> {
  const response = await adminRequestWithStoredToken<AdminPage>("/admin/pages", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Page could not be created.");
  }

  return response.data;
}

export async function updateAdminPage(pageId: string, input: AdminPageInput): Promise<AdminPage> {
  const response = await adminRequestWithStoredToken<AdminPage>(`/admin/pages/${encodeURIComponent(pageId)}`, {
    body: JSON.stringify(input),
    method: "PUT",
  });

  if (response.data === null) {
    throw new Error("Page could not be updated.");
  }

  return response.data;
}

export async function fetchAdminPosts(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminPosts> {
  const response = await adminRequestWithStoredToken<AdminPost[]>(
    `/admin/posts?page=${input.page}&page_size=${input.pageSize}`
  );

  return { data: response.data ?? [], meta: response.meta as AdminPaginationMeta };
}

export async function fetchAdminPost(postId: string): Promise<AdminPost> {
  const response = await adminRequestWithStoredToken<AdminPost>(`/admin/posts/${encodeURIComponent(postId)}`);

  if (response.data === null) {
    throw new Error("Post was not found.");
  }

  return response.data;
}

export async function createAdminPost(input: AdminPostInput): Promise<AdminPost> {
  const response = await adminRequestWithStoredToken<AdminPost>("/admin/posts", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Post could not be created.");
  }

  return response.data;
}

export async function updateAdminPost(postId: string, input: AdminPostInput): Promise<AdminPost> {
  const response = await adminRequestWithStoredToken<AdminPost>(`/admin/posts/${encodeURIComponent(postId)}`, {
    body: JSON.stringify(input),
    method: "PUT",
  });

  if (response.data === null) {
    throw new Error("Post could not be updated.");
  }

  return response.data;
}

export async function fetchAdminSeoMetadataList(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminSeoMetadata> {
  const response = await adminRequestWithStoredToken<AdminSeoMetadata[]>(
    `/admin/seo?page=${input.page}&page_size=${input.pageSize}`
  );

  return { data: response.data ?? [], meta: response.meta as AdminPaginationMeta };
}

export async function fetchAdminSeoMetadata(seoMetadataId: string): Promise<AdminSeoMetadata> {
  const response = await adminRequestWithStoredToken<AdminSeoMetadata>(
    `/admin/seo/${encodeURIComponent(seoMetadataId)}`
  );

  if (response.data === null) {
    throw new Error("SEO metadata was not found.");
  }

  return response.data;
}

export async function createAdminSeoMetadata(input: AdminSeoMetadataInput): Promise<AdminSeoMetadata> {
  const response = await adminRequestWithStoredToken<AdminSeoMetadata>("/admin/seo", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("SEO metadata could not be created.");
  }

  return response.data;
}

export async function updateAdminSeoMetadata(
  seoMetadataId: string,
  input: AdminSeoMetadataInput
): Promise<AdminSeoMetadata> {
  const response = await adminRequestWithStoredToken<AdminSeoMetadata>(
    `/admin/seo/${encodeURIComponent(seoMetadataId)}`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    }
  );

  if (response.data === null) {
    throw new Error("SEO metadata could not be updated.");
  }

  return response.data;
}

export async function fetchAdminRedirects(input: {
  page: number;
  pageSize: number;
}): Promise<PaginatedAdminRedirects> {
  const response = await adminRequestWithStoredToken<AdminRedirect[]>(
    `/admin/redirects?page=${input.page}&page_size=${input.pageSize}`
  );

  return { data: response.data ?? [], meta: response.meta as AdminPaginationMeta };
}

export async function fetchAdminRedirect(redirectId: string): Promise<AdminRedirect> {
  const response = await adminRequestWithStoredToken<AdminRedirect>(
    `/admin/redirects/${encodeURIComponent(redirectId)}`
  );

  if (response.data === null) {
    throw new Error("Redirect was not found.");
  }

  return response.data;
}

export async function createAdminRedirect(input: AdminRedirectInput): Promise<AdminRedirect> {
  const response = await adminRequestWithStoredToken<AdminRedirect>("/admin/redirects", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Redirect could not be created.");
  }

  return response.data;
}

export async function updateAdminRedirect(redirectId: string, input: AdminRedirectInput): Promise<AdminRedirect> {
  const response = await adminRequestWithStoredToken<AdminRedirect>(
    `/admin/redirects/${encodeURIComponent(redirectId)}`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    }
  );

  if (response.data === null) {
    throw new Error("Redirect could not be updated.");
  }

  return response.data;
}

export async function createAdminMediaPresign(input: AdminMediaPresignInput): Promise<AdminMediaPresign> {
  const response = await adminRequestWithStoredToken<AdminMediaPresign>("/admin/media/presign", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Media upload could not be prepared.");
  }

  return response.data;
}

export async function completeAdminMediaUpload(input: AdminMediaCompleteInput): Promise<AdminMedia> {
  const response = await adminRequestWithStoredToken<AdminMedia>("/admin/media/complete", {
    body: JSON.stringify(input),
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Media upload could not be completed.");
  }

  return response.data;
}

async function adminProductMutation(path: string): Promise<AdminProduct> {
  const response = await adminRequestWithStoredToken<AdminProduct>(path, { method: "POST" });

  if (response.data === null) {
    throw new Error("Product mutation failed.");
  }

  return response.data;
}

async function adminRequestWithStoredToken<T>(
  path: string,
  init: RequestInit = {}
): Promise<AdminEnvelope<T>> {
  const { readStoredAccessToken } = await import("lib/auth");
  const accessToken = readStoredAccessToken();

  if (!accessToken) {
    throw new AdminApiError("Login is required.", 401, "ACCESS_TOKEN_REQUIRED");
  }

  return adminRequest<T>(path, accessToken, init);
}

async function adminRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<AdminEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as AdminEnvelope<T>;

  if (!response.ok || payload.error) {
    throw new AdminApiError(
      payload.error?.message ?? "Admin request failed.",
      response.status,
      payload.error?.code ?? null
    );
  }

  return payload;
}
