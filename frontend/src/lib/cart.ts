import { readStoredAccessToken } from "lib/auth";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  currency_code: string;
};

export type CartVariant = {
  id: string;
  sku: string;
  price: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: CartProduct;
  variant: CartVariant;
};

export type Cart = {
  id: string;
  status: string;
  items: CartItem[];
};

type CartEnvelope<T> = {
  data: T | null;
  meta: Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
const cartSessionStorageKey = "duocmeta_cart_session_id";

export async function fetchCart(): Promise<Cart> {
  return cartRequest<Cart>("/cart", { method: "GET" });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return cartRequest<Cart>(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return cartRequest<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
}

export function formatMoney(value: string | number, currencyCode: string): string {
  const amount = typeof value === "number" ? value : Number(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCartSubtotal(cart: Cart): number {
  return cart.items.reduce((total, item) => total + Number(item.variant.price) * item.quantity, 0);
}

async function cartRequest<T>(path: string, init: RequestInit): Promise<T> {
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
  const payload = (await response.json()) as CartEnvelope<T>;

  if (!response.ok || payload.error || payload.data === null) {
    throw new Error(payload.error?.message ?? "Cart request failed.");
  }

  return payload.data;
}

function authorizationHeader(): Record<string, string> {
  const accessToken = readStoredAccessToken();

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function readOrCreateCartSessionId(): string {
  if (typeof window === "undefined") {
    return "server-cart-session";
  }

  const existingSessionId = window.localStorage.getItem(cartSessionStorageKey);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = window.crypto.randomUUID();
  window.localStorage.setItem(cartSessionStorageKey, sessionId);
  return sessionId;
}
