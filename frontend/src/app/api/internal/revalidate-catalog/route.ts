import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { publicCatalogCacheTag } from "lib/cache";


const apiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { ok: false, error: "MISSING_AUTHORIZATION" },
      { status: 401 }
    );
  }

  const probe = await fetch(`${apiBaseUrl}/admin/brands?page=1&page_size=1`, {
    cache: "no-store",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
  });

  if (!probe.ok) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  revalidateTag(publicCatalogCacheTag);

  return NextResponse.json({ ok: true });
}
