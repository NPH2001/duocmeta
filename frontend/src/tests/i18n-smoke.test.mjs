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

describe("EN/VI storefront language switching", () => {
  it("provides a dependency-free translation layer with English and Vietnamese dictionaries", () => {
    const i18n = expectFile("src/lib/i18n.ts");

    assert.match(i18n, /locales = \["en", "vi"\]/, "supported locales should be locked to EN and VI");
    assert.match(i18n, /defaultLocale: Locale = "en"/, "English should remain the safe default locale");
    assert.match(i18n, /"nav\.products": "Products"/, "English navigation copy should be present");
    assert.match(i18n, /"nav\.products": "Sản phẩm"/, "Vietnamese navigation copy should be present");
    assert.match(i18n, /"home\.title"/, "homepage copy should be translated through dictionary keys");
    assert.match(i18n, /"checkout\.placeOrder"/, "checkout action copy should be translated through dictionary keys");
  });

  it("wraps the app in the language provider and renders a persistent switcher in the header", () => {
    const layout = expectFile("src/app/layout.tsx");
    const header = expectFile("src/components/layout/SiteHeader.tsx");
    const provider = expectFile("src/features/i18n/LanguageProvider.tsx");
    const switcher = expectFile("src/features/i18n/LanguageSwitcher.tsx");

    assert.match(layout, /<LanguageProvider>/, "root layout should provide language context to the website");
    assert.match(layout, /suppressHydrationWarning/, "html lang updates should avoid hydration warnings");
    assert.match(header, /<LanguageSwitcher \/>/, "site header should expose the language switcher globally");
    assert.match(provider, /localStorage\.setItem\(localeStorageKey, nextLocale\)/, "locale selection should persist in local storage");
    assert.match(provider, /document\.cookie = `\$\{localeCookieName\}=\$\{nextLocale\}/, "locale selection should persist in a cookie");
    assert.match(switcher, /aria-pressed=\{locale === option\}/, "switcher buttons should expose selected state accessibly");
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
