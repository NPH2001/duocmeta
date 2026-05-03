import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const rootDir = new URL("../..", import.meta.url).pathname;

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function expectFile(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  assert.equal(existsSync(absolutePath), true, `${relativePath} should exist`);
  return readSource(relativePath);
}

describe("Core Web Vitals guardrails", () => {
  it("keeps public route revalidation explicit by content type", () => {
    const cache = expectFile("src/lib/cache.ts");
    const cmsClient = expectFile("src/lib/cms.ts");

    assert.match(cache, /publicCmsRevalidateSeconds\s*=\s*5 \* 60/, "CMS fetch cache should remain five minutes");
    assert.match(cmsClient, /next:\s*\{ revalidate: publicCmsRevalidateSeconds \}/, "CMS fetches should use shared ISR revalidation");

    [
      "src/app/page.tsx",
      "src/app/products/page.tsx",
      "src/app/products/[slug]/page.tsx",
      "src/app/categories/page.tsx",
      "src/app/categories/[slug]/page.tsx",
    ].forEach((route) => {
      const source = expectFile(route);
      assert.match(source, /export const revalidate = 3600;/, `${route} should use one-hour static storefront revalidation`);
    });

    ["src/app/blog/page.tsx", "src/app/blog/[slug]/page.tsx", "src/app/pages/[slug]/page.tsx"].forEach((route) => {
      const source = expectFile(route);
      assert.match(source, /export const revalidate = 300;/, `${route} should use five-minute CMS route revalidation`);
    });
  });

  it("uses Next image optimization for CMS image blocks", () => {
    const nextConfig = expectFile("next.config.ts");
    const contentBlocks = expectFile("src/features/content/ContentBlocks.tsx");
    const envExample = expectFile(".env.example");

    assert.match(nextConfig, /formats:\s*\["image\/avif", "image\/webp"\]/, "Next images should prefer AVIF/WebP");
    assert.match(nextConfig, /minimumCacheTTL:\s*60 \* 60 \* 24/, "optimized images should have a stable cache TTL");
    assert.match(nextConfig, /NEXT_PUBLIC_MEDIA_BASE_URL/, "remote media host should be configurable");
    assert.match(envExample, /NEXT_PUBLIC_MEDIA_BASE_URL=/, "media host should be documented for frontend deploys");
    assert.match(contentBlocks, /import Image from "next\/image"/, "CMS image blocks should use next/image");
    assert.match(contentBlocks, /loading="lazy"/, "non-hero CMS images should lazy-load");
    assert.match(contentBlocks, /sizes="\(min-width: 1024px\) 896px, calc\(100vw - 48px\)"/, "CMS images should declare responsive sizes");
    assert.doesNotMatch(contentBlocks, /<img\b/, "raw img tags should not be used for CMS blocks");
  });

  it("defers non-critical browser work until idle", () => {
    const idle = expectFile("src/lib/browser-idle.ts");
    const authStatus = expectFile("src/features/auth/AuthStatus.tsx");
    const errorTracking = expectFile("src/features/error-tracking/FrontendErrorTracking.tsx");

    assert.match(idle, /requestIdleCallback/, "idle helper should use requestIdleCallback when available");
    assert.match(idle, /setTimeout/, "idle helper should have a browser fallback");
    assert.match(authStatus, /onBrowserIdle\(/, "guest auth refresh should not run during initial render work");
    assert.match(errorTracking, /onBrowserIdle\(/, "global error listener registration should be deferred");
  });
});
