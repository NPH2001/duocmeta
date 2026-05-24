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

  it("provides phone, Zalo, and Messenger links with downloaded app icons and accessible labels", () => {
    const component = expectFile("src/features/contact/FloatingContactButtons.tsx");
    const config = expectFile("src/lib/contact.ts");
    const envExample = expectFile(".env.example");
    const i18n = expectFile("src/lib/i18n.ts");
    const icons = expectFile("src/components/icons/SocialBrandIcon.tsx");

    ["phone", "zalo", "messenger"].forEach((channel) => {
      assert.match(config, new RegExp(`channel: "${channel}"`), `${channel} link should be configured`);
      assert.match(i18n, new RegExp(`"contact\\.${channel}"`), `${channel} label should be translatable`);
    });

    assert.match(component, /ContactChannelIcon/, "floating contact buttons should use an icon helper");
    assert.match(component, /brand="zalo"/, "floating contact buttons should render the Zalo app icon");
    assert.match(component, /brand="messenger"/, "floating contact buttons should render the Messenger app icon");
    assert.match(component, /bg-white ring-1 ring-\[#0068FF\]\/20/, "Zalo button should frame the downloaded app icon cleanly");
    assert.match(component, /bg-white ring-1 ring-\[#0084FF\]\/20/, "Messenger button should frame the downloaded app icon cleanly");
    assert.match(icons, /"\/icons\/social\/zalo\.png"/, "shared icon set should include downloaded Zalo art");
    assert.match(icons, /"\/icons\/social\/messenger\.png"/, "shared icon set should include downloaded Messenger art");
    ["public/icons/social/zalo.png", "public/icons/social/messenger.png"].forEach(expectFile);
    assert.match(envExample, /NEXT_PUBLIC_CONTACT_PHONE_HREF=tel:/, "phone contact URL should be configurable");
    assert.match(envExample, /NEXT_PUBLIC_CONTACT_ZALO_HREF=https:\/\/zalo\.me\//, "Zalo contact URL should be configurable");
    assert.match(envExample, /NEXT_PUBLIC_CONTACT_MESSENGER_HREF=https:\/\/m\.me\//, "Messenger contact URL should be configurable");
    assert.match(component, /target=\{link\.href\.startsWith\("http"\) \? "_blank" : undefined\}/, "external contact links should open safely");
    assert.match(component, /rel=\{link\.href\.startsWith\("http"\) \? "noreferrer" : undefined\}/, "external links should avoid referrer leakage");
  });
});
