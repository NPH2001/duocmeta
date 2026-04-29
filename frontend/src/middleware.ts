import { NextResponse, type NextRequest } from "next/server";

type RedirectEnvelope = {
  data: {
    from_path: string;
    to_path: string;
    status_code: 301 | 302 | 307 | 308;
  } | null;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
};

const apiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const ignoredPrefixes = [
  "/_next",
  "/api",
  "/admin",
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
];

const ignoredExactPaths = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldSkipRedirectLookup(pathname)) {
    return NextResponse.next();
  }

  const redirect = await resolveRedirect(pathname);
  if (!redirect) {
    return NextResponse.next();
  }

  const target = new URL(redirect.to_path, request.url);
  if (!target.search && search) {
    target.search = search;
  }

  if (target.pathname === pathname && target.search === search) {
    return NextResponse.next();
  }

  return NextResponse.redirect(target, redirect.status_code);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

async function resolveRedirect(pathname: string): Promise<RedirectEnvelope["data"]> {
  try {
    const url = new URL("/redirects/resolve", apiBaseUrl);
    url.searchParams.set("from_path", pathname);

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    const payload = (await response.json()) as RedirectEnvelope;
    if (!response.ok || payload.error || !payload.data) {
      return null;
    }

    return payload.data;
  } catch {
    return null;
  }
}

function shouldSkipRedirectLookup(pathname: string): boolean {
  if (ignoredExactPaths.has(pathname)) {
    return true;
  }

  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return true;
  }

  return ignoredPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
