export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  status: string;
  email_verified_at: string | null;
};

type AuthEnvelope<T> = {
  data: T | null;
  meta: Record<string, never>;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

type AuthPayload = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export const accessTokenStorageKey = "duocmeta_access_token";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function loginWithPassword(email: string, password: string): Promise<AuthPayload> {
  return authRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<AuthPayload> {
  return authRequest<AuthPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function refreshSession(): Promise<AuthPayload> {
  return authRequest<AuthPayload>("/auth/refresh", {
    method: "POST",
  });
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  return authRequest<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(accessTokenStorageKey);
}

export function storeAccessToken(accessToken: string): void {
  window.localStorage.setItem(accessTokenStorageKey, accessToken);
  window.dispatchEvent(new Event("duocmeta-auth-change"));
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(accessTokenStorageKey);
  window.dispatchEvent(new Event("duocmeta-auth-change"));
}

async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as AuthEnvelope<T>;

  if (!response.ok || payload.error || payload.data === null) {
    throw new Error(payload.error?.message ?? "Authentication request failed.");
  }

  return payload.data;
}
