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
    assert.match(productRoute, /notFound\(\)/, "unknown product detail routes should 404");
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
    assert.match(checkoutPage, /initiatePayment\(/, "checkout should request backend payment initiation before success/redirect");
    assert.match(successRoute, /searchParams/, "success route should read order_code from query params");
    assert.match(successPage, /orderCode/, "success page should render the backend order code");
    assert.match(successPage, /href="\/products"/, "success page should allow returning to shopping");
  });
});
