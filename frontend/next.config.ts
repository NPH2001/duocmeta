import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outputFileTracingRoot = dirname(fileURLToPath(import.meta.url));

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const mediaRemotePatterns = [
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:8080/media",
]
  .map(remotePatternFromUrl)
  .filter((pattern): pattern is RemotePattern => pattern !== null)
  .filter(
    (pattern, index, patterns) =>
      patterns.findIndex(
        (candidate) =>
          candidate.protocol === pattern.protocol &&
          candidate.hostname === pattern.hostname &&
          candidate.port === pattern.port &&
          candidate.pathname === pattern.pathname
      ) === index
  );

const nextConfig: NextConfig = {
  outputFileTracingRoot,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: mediaRemotePatterns,
  },
  reactStrictMode: true,
};

function remotePatternFromUrl(value: string | undefined): RemotePattern | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const protocol = url.protocol === "https:" ? "https" : url.protocol === "http:" ? "http" : null;

    if (!protocol) {
      return null;
    }

    return {
      hostname: url.hostname,
      pathname: `${url.pathname.replace(/\/$/, "") || ""}/**`,
      port: url.port,
      protocol,
    };
  } catch {
    return null;
  }
}

export default nextConfig;
