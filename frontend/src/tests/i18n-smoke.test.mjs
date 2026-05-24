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

describe("Vietnamese-first storefront language", () => {
  it("uses Vietnamese as the fixed public default locale", () => {
    const i18n = expectFile("src/lib/i18n.ts");
    const provider = expectFile("src/features/i18n/LanguageProvider.tsx");
    const layout = expectFile("src/app/layout.tsx");

    assert.match(i18n, /defaultLocale: Locale = "vi"/, "Vietnamese should be the default locale");
    assert.match(i18n, /"nav\.products": "Sản phẩm"/, "Vietnamese navigation copy should be present");
    assert.match(layout, /<html lang="vi"/, "root html should declare Vietnamese");
    assert.doesNotMatch(provider, /localStorage\.setItem\(localeStorageKey, nextLocale\)/, "public locale should not be changed from the header");
    assert.match(provider, /document\.documentElement\.lang = defaultLocale/, "provider should keep the document language on the Vietnamese default");
  });

  it("removes customer auth and language controls from the public header while keeping admin login", () => {
    const header = expectFile("src/components/layout/SiteHeader.tsx");

    assert.doesNotMatch(header, /<LanguageSwitcher \/>/, "site header should not expose language switching");
    assert.doesNotMatch(header, /<AuthStatus \/>/, "site header should not expose customer login state");
    assert.doesNotMatch(header, /href: "\/account"/, "customer account nav should be removed");
    assert.match(header, /href="\/login"/, "admin login entry should remain available");
    assert.match(header, /Quản trị/, "admin login entry should be labeled in Vietnamese");
  });

  it("redirects customer-only auth and account routes away from public login flows", () => {
    for (const route of [
      "src/app/register/page.tsx",
      "src/app/forgot-password/page.tsx",
      "src/app/account/page.tsx",
      "src/app/account/orders/page.tsx",
      "src/app/account/orders/[orderCode]/page.tsx",
    ]) {
      const source = expectFile(route);
      assert.match(source, /redirect\(/, `${route} should redirect away from the disabled customer flow`);
      assert.match(source, /noIndexRobots/, `${route} should be noindexed`);
    }
  });

  it("uses a Vietnamese-safe font stack without oversized tracking", () => {
    const globals = expectFile("src/app/globals.css");

    assert.match(globals, /font-family:[\s\S]*Arial,[\s\S]*"Segoe UI",[\s\S]*system-ui,[\s\S]*sans-serif;/, "global font stack should prefer fonts with reliable Vietnamese diacritic support");
    assert.doesNotMatch(globals, /Georgia, \"Times New Roman\", serif/, "serif fallback should not render Vietnamese accents as detached glyphs");
    assert.match(globals, /html\[lang=\"vi\"\] \.uppercase \{[\s\S]*letter-spacing: 0\.04em;/, "Vietnamese uppercase labels should not use oversized tracking around accents");
  });

  it("routes core storefront and commerce UI through translation keys", () => {
    const home = expectFile("src/features/home/HomePage.tsx");
    const products = expectFile("src/features/products/ProductsIndexPage.tsx");
    const categories = expectFile("src/features/categories/CategoryListingPage.tsx");
    const cart = expectFile("src/features/cart/CartPage.tsx");
    const checkout = expectFile("src/features/checkout/CheckoutPage.tsx");

    assert.match(home, /t\("home\.title"\)/, "home hero should use translated copy");
    assert.match(products, /t\("products\.viewProduct"\)/, "product cards should use translated CTA copy");
    assert.match(categories, /t\("categories\.filters"\)/, "category filters should use translated labels");
    assert.match(cart, /t\("cart\.checkout"\)/, "cart checkout CTA should be translated");
    assert.match(checkout, /t\("checkout\.placeOrder"\)/, "checkout submit CTA should be translated");
  });
});
