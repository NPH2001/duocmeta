import { readStoredAccessToken } from "lib/auth";
import { readOrCreateCartSessionId } from "lib/cart";

export type OrderItem = {
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

export type Order = {
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
  items: OrderItem[];
};

export type PaymentInitiation = {
  id: string;
  order_code: string;
  provider_code: string;
  method_code: string;
  status: string;
  amount: string;
  transaction_reference: string | null;
  action_url: string | null;
  provider_payload: Record<string, unknown>;
};

export type CheckoutPreviewItem = {
  cart_item_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total_amount: string;
};

export type CheckoutPreview = {
  currency_code: string;
  subtotal_amount: string;
  discount_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  coupon_code: string | null;
  validation_warnings: string[];
  items: CheckoutPreviewItem[];
};

type ApiEnvelope<T> = {
  data: T | null;
  meta: Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
const checkoutIdempotencyStorageKey = "duocmeta_checkout_idempotency_key";

export async function previewCheckout(input: {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine1: string;
  shippingMethod: string;
  paymentMethod: string;
  couponCode: string;
}): Promise<CheckoutPreview> {
  return checkoutRequest<CheckoutPreview>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify({
      shipping_address: {
        full_name: input.fullName,
        phone: input.phone,
        province: input.province,
        district: input.district,
        ward: input.ward,
        address_line1: input.addressLine1,
      },
      shipping_method: input.shippingMethod,
      payment_method: input.paymentMethod,
      coupon_code: input.couponCode || null,
    }),
  });
}

export async function placeOrder(input: {
  email: string;
  phone: string;
  notes?: string;
}): Promise<Order> {
  return checkoutRequest<Order>("/checkout/place-order", {
    method: "POST",
    headers: {
      "Idempotency-Key": readOrCreateCheckoutIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function initiatePayment(input: {
  orderCode: string;
  providerCode: string;
  methodCode: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PaymentInitiation> {
  return checkoutRequest<PaymentInitiation>(`/payments/${input.orderCode}/initiate`, {
    method: "POST",
    body: JSON.stringify({
      provider_code: input.providerCode,
      method_code: input.methodCode,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    }),
  });
}

export function clearCheckoutIdempotencyKey(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(checkoutIdempotencyStorageKey);
  }
}

async function checkoutRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Cart-Session-ID": readOrCreateCartSessionId(),
      ...authorizationHeader(),
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.error || payload.data === null) {
    throw new Error(payload.error?.message ?? "Checkout request failed.");
  }

  return payload.data;
}

function authorizationHeader(): Record<string, string> {
  const accessToken = readStoredAccessToken();

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function readOrCreateCheckoutIdempotencyKey(): string {
  if (typeof window === "undefined") {
    return "server-checkout-idempotency-key";
  }

  const existingKey = window.localStorage.getItem(checkoutIdempotencyStorageKey);
  if (existingKey) {
    return existingKey;
  }

  const idempotencyKey = window.crypto.randomUUID();
  window.localStorage.setItem(checkoutIdempotencyStorageKey, idempotencyKey);
  return idempotencyKey;
}
