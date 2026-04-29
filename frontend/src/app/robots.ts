import type { MetadataRoute } from "next";

import { siteUrl } from "lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/account",
        "/account/",
        "/cart",
        "/checkout",
        "/login",
        "/register",
        "/forgot-password",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
