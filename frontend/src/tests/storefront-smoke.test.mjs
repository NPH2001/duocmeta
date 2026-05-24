import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../..", import.meta.url).pathname;

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function expectFile(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  assert.equal(existsSync(absolutePath), true, `${relativePath} should exist`);
  return readSource(relativePath);
}

describe("storefront smoke route chain", () => {
  it("keeps the public happy-path routes present", () => {
    [
      "src/app/page.tsx",
      "src/app/products/page.tsx",
      "src/app/products/[slug]/page.tsx",
      "src/app/cart/page.tsx",
      "src/app/checkout/page.tsx",
      "src/app/checkout/success/page.tsx",
    ].forEach(expectFile);
  });

  it("links home to product browsing and product cards to product details", () => {
    const homePage = expectFile("src/features/home/HomePage.tsx");
    const productsIndex = expectFile("src/features/products/ProductsIndexPage.tsx");
    const productRoute = expectFile("src/app/products/[slug]/page.tsx");

    assert.match(homePage, /href="\/products"/, "home page should link to product browsing");
    assert.match(productsIndex, /href=\{`\/products\/\$\{product\.slug\}`\}/, "product cards should link to details");
    assert.match(productRoute, /generateStaticParams/, "product detail route should predeclare static product paths");
    assert.match(productRoute, /fetchPublicProduct\(/, "product detail route should fetch public product data from backend API");
    assert.match(productRoute, /notFound\(\)/, "unknown product detail routes should 404");
  });

  it("keeps the homepage shorter with one compact pharmacy overview image and backend-backed catalog data", () => {
    const header = expectFile("src/components/layout/SiteHeader.tsx");
    const homePage = expectFile("src/features/home/HomePage.tsx");
    const homeRoute = expectFile("src/app/page.tsx");
    const layout = expectFile("src/app/layout.tsx");
    const catalogClient = expectFile("src/lib/catalog.ts");
    const route = expectFile("src/app/page.tsx");
    const i18n = expectFile("src/lib/i18n.ts");

    assert.match(header, /Hotline tư vấn/, "header should include the pharmacy utility contact strip");
    assert.match(header, /Danh mục sản phẩm/, "header should expose a category navigation rail");
    assert.match(header, /href="\/cart"/, "header should keep cart entry visible");
    assert.match(layout, /fetchPublicCategories\(/, "root layout should load header categories from backend API");
    assert.match(homeRoute, /fetchPublicCategories\(/, "home route should load categories from backend API");
    assert.match(homeRoute, /fetchPublicProducts\(/, "home route should load products from backend API");
    assert.match(catalogClient, /\/api\/v1/, "catalog client should call versioned backend API routes");
    assert.match(catalogClient, /primary_image/, "catalog client should type public product primary images");
    assert.match(catalogClient, /return buildMediaUrlFromStorageKey\(storageKey, mediaBaseUrl\)/, "catalog client should delegate media URL building to shared helper");
    assert.match(catalogClient, /encodeURIComponent/, "catalog media URLs should encode storage path segments safely");
    assert.match(homePage, /categoryMenu/, "homepage should include a left category menu");
    assert.match(homePage, /serviceCards/, "homepage should include trust service cards");
    assert.match(homePage, /Tổng quan nhà thuốc/, "homepage should include a short overview section");
    assert.match(homePage, /Một hình ảnh ngắn gọn để người dùng hiểu nhanh Duocmeta phục vụ điều gì/, "homepage should use concise overview copy");
    assert.match(homePage, /overviewHighlights/, "homepage should keep only short supporting highlights");
    assert.match(homePage, /\/landing\/pharmacist-support\.svg/, "homepage should use one compact overview image");
    assert.doesNotMatch(homePage, /Đi từ nhu cầu đến hành động đúng/, "homepage should remove the longer navigator section");
    assert.doesNotMatch(homePage, /Một landing đẹp hơn cần đi cùng thông tin đúng vai trò/, "homepage should remove the long disclaimer block");
    assert.doesNotMatch(homePage, /Câu hỏi thường gặp/, "homepage should remove the long FAQ block from landing");
    ["public/landing/pharmacist-support.svg", "public/landing/pharmacy-hero.svg"].forEach(expectFile);
    assert.match(homePage, /ProductShelf/, "homepage should keep repeated product shelf sections");
    assert.match(homePage, /buildPublicMediaUrl/, "homepage product cards should render backend product images");
    assert.match(homePage, /unoptimized/, "dynamic backend product images should bypass Next optimizer and load from media endpoint directly");
    assert.match(homePage, /Liên hệ nhanh khi cần/, "homepage should end with a short CTA section");
    assert.match(route, /Landing nhà thuốc trực tuyến Duocmeta/, "homepage metadata should describe the pharmacy landing intent");
    assert.match(i18n, /Landing nhà thuốc rõ thông tin/, "i18n should reflect the pharmacy-first hero copy");
  });

  it("keeps the pharmacy-style footer mounted with support, policy, contact, and downloadable social app icons", () => {
    const layout = expectFile("src/app/layout.tsx");
    const footer = expectFile("src/components/layout/SiteFooter.tsx");
    const icons = expectFile("src/components/icons/SocialBrandIcon.tsx");

    assert.match(layout, /<SiteFooter \/>/, "root layout should render the public storefront footer");
    assert.match(footer, /Duocmeta Pharmacy/, "footer should preserve a branded pharmacy footer masthead");
    assert.match(footer, /Hỗ trợ khách hàng/, "footer should include a customer support link column");
    assert.match(footer, /Chính sách/, "footer should include a policy link column");
    assert.match(footer, /Mọi thắc mắc liên hệ/, "footer should include contact details");
    assert.match(footer, /overflow-hidden rounded-2xl bg-white p-1\.5/, "footer social links should show image-style app badges");
    assert.match(icons, /next\/image/, "shared social icon component should use Next Image for downloaded assets");
    assert.match(icons, /"\/icons\/social\/facebook\.png"/, "shared icon component should reference local Facebook app art");
    assert.match(icons, /"\/icons\/social\/youtube\.png"/, "shared icon component should reference local YouTube app art");
    assert.match(icons, /"\/icons\/social\/instagram\.png"/, "shared icon component should reference local Instagram app art");
    [
      "public/icons/social/facebook.png",
      "public/icons/social/instagram.png",
      "public/icons/social/youtube.png",
      "public/icons/social/tiktok.png",
      "public/icons/social/linkedin.png",
    ].forEach(expectFile);
    assert.match(footer, /Thông tin trên website chỉ phục vụ mục đích tham khảo/, "footer should include medical-content disclaimer");
    assert.doesNotMatch(footer, /TRUNG TÂM THUỐC CENTRAL PHARMACY/, "footer should not copy the reference brand verbatim");
  });

  it("keeps cart and checkout connected without frontend-owned totals", () => {
    const cartPage = expectFile("src/features/cart/CartPage.tsx");
    const checkoutPage = expectFile("src/features/checkout/CheckoutPage.tsx");
    const checkoutClient = expectFile("src/lib/checkout.ts");

    assert.match(cartPage, /href="\/checkout"/, "cart should link to checkout");
    assert.match(checkoutPage, /fetchCart\(\)/, "checkout should load cart through backend API client");
    assert.match(checkoutPage, /previewCheckout\(/, "checkout should use backend preview totals");
    assert.match(checkoutClient, /\/checkout\/preview/, "preview client should call checkout preview API");
    assert.match(checkoutClient, /Idempotency-Key/, "place-order client should send idempotency key");
    assert.match(checkoutClient, /\/checkout\/place-order/, "place-order client should call backend place-order API");
    assert.doesNotMatch(checkoutPage, /grandTotal\s*=|total\s*=\s*subtotal/, "checkout page should not calculate final authority totals inline");
  });

  it("keeps checkout success reachable after backend place-order/payment action", () => {
    const checkoutPage = expectFile("src/features/checkout/CheckoutPage.tsx");
    const successRoute = expectFile("src/app/checkout/success/page.tsx");
    const successPage = expectFile("src/features/checkout/OrderSuccessPage.tsx");

    assert.match(checkoutPage, /\/checkout\/success\?order_code=\$\{order\.order_code\}/, "checkout should route to success with backend order code");
    assert.match(checkoutPage, /initiatePayment\(/, "checkout should request backend payment initiation before success\/redirect");
    assert.match(successRoute, /searchParams/, "success route should read order_code from query params");
    assert.match(successPage, /orderCode/, "success page should render the backend order code");
    assert.match(successPage, /href="\/products"/, "success page should allow returning to shopping");
  });
});
