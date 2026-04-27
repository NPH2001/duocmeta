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
