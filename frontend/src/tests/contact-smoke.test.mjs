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

describe("floating storefront contact shortcuts", () => {
  it("mounts fixed contact buttons globally from the root layout", () => {
    const layout = expectFile("src/app/layout.tsx");
    const component = expectFile("src/features/contact/FloatingContactButtons.tsx");

    assert.match(layout, /<FloatingContactButtons \/>/, "root layout should render the floating contact shortcuts");
    assert.match(component, /fixed bottom-5 right-5 z-50/, "contact shortcuts should stay fixed in the lower-right viewport");
    assert.match(component, /aria-label=\{t\("contact\.ariaLabel"\)\}/, "contact group should have an accessible label");
  });

  it("provides phone, Zalo, and Messenger links with icons and accessible labels", () => {
    const component = expectFile("src/features/contact/FloatingContactButtons.tsx");
    const config = expectFile("src/lib/contact.ts");
    const envExample = expectFile(".env.example");
    const i18n = expectFile("src/lib/i18n.ts");

    ["phone", "zalo", "messenger"].forEach((channel) => {
      assert.match(config, new RegExp(`channel: "${channel}"`), `${channel} link should be configured`);
      assert.match(component, new RegExp(`${channel}`), `${channel} icon branch should be rendered`);
      assert.match(i18n, new RegExp(`"contact\\.${channel}"`), `${channel} label should be translatable`);
    });

    assert.match(envExample, /NEXT_PUBLIC_CONTACT_PHONE_HREF=tel:/, "phone contact URL should be configurable");
    assert.match(envExample, /NEXT_PUBLIC_CONTACT_ZALO_HREF=https:\/\/zalo\.me\//, "Zalo contact URL should be configurable");
    assert.match(envExample, /NEXT_PUBLIC_CONTACT_MESSENGER_HREF=https:\/\/m\.me\//, "Messenger contact URL should be configurable");
    assert.match(component, /target=\{link\.href\.startsWith\("http"\) \? "_blank" : undefined\}/, "external contact links should open safely");
    assert.match(component, /rel=\{link\.href\.startsWith\("http"\) \? "noreferrer" : undefined\}/, "external links should avoid referrer leakage");
  });
});
