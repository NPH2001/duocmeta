import { readStoredAccessToken } from "lib/auth";

export type CustomerOrderListItem = {
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

export type CustomerOrderItem = {
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

export type CustomerOrderDetail = {
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
  items: CustomerOrderItem[];
};

export type PaginatedOrders = {
  data: CustomerOrderListItem[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

type OrdersEnvelope<T> = {
  data: T | null;
  meta: PaginatedOrders["meta"] | Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function fetchCustomerOrders(input: { page: number; pageSize: number }): Promise<PaginatedOrders> {
  const response = await ordersRequest<CustomerOrderListItem[]>(
    `/orders?page=${input.page}&page_size=${input.pageSize}`
  );

  return {
    data: response.data ?? [],
    meta: response.meta as PaginatedOrders["meta"],
  };
}

export async function fetchCustomerOrder(orderCode: string): Promise<CustomerOrderDetail> {
  const response = await ordersRequest<CustomerOrderDetail>(`/orders/${encodeURIComponent(orderCode)}`);

  if (response.data === null) {
    throw new Error("Order was not found.");
  }

  return response.data;
}

export async function cancelCustomerOrder(orderCode: string): Promise<CustomerOrderDetail> {
  const response = await ordersRequest<CustomerOrderDetail>(`/orders/${encodeURIComponent(orderCode)}/cancel`, {
    method: "POST",
  });

  if (response.data === null) {
    throw new Error("Order could not be cancelled.");
  }

  return response.data;
}

function authorizationHeader(): Record<string, string> {
  const accessToken = readStoredAccessToken();

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function ordersRequest<T>(path: string, init: RequestInit = {}): Promise<OrdersEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
      ...authorizationHeader(),
    },
  });
  const payload = (await response.json()) as OrdersEnvelope<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Orders request failed.");
  }

  return payload;
}
