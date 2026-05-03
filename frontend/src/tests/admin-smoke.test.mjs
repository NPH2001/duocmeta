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

describe("admin smoke workflow", () => {
  it("keeps protected admin routes present for the smoke path", () => {
    [
      "src/app/admin/layout.tsx",
      "src/app/admin/page.tsx",
      "src/app/admin/products/page.tsx",
      "src/app/admin/products/new/page.tsx",
      "src/app/admin/products/[productId]/edit/page.tsx",
      "src/app/admin/variants/page.tsx",
      "src/app/admin/variants/new/page.tsx",
      "src/app/admin/variants/[variantId]/edit/page.tsx",
      "src/app/admin/variants/[variantId]/inventory/page.tsx",
      "src/app/admin/orders/page.tsx",
      "src/app/admin/orders/[orderCode]/page.tsx",
    ].forEach(expectFile);
  });

  it("guards admin with authenticated RBAC checks and a login fallback", () => {
    const adminLayout = expectFile("src/features/admin/AdminLayout.tsx");
    const adminGuard = expectFile("src/features/admin/AdminAuthGuard.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(adminLayout, /<AdminAuthGuard>/, "admin layout should wrap routes in the auth guard");
    assert.match(adminGuard, /readStoredAccessToken\(\)/, "guard should start from the stored access token");
    assert.match(adminGuard, /fetchCurrentUser\(/, "guard should load the authenticated user");
    assert.match(adminGuard, /refreshSession\(/, "guard should retry with refresh cookies before showing guest state");
    assert.match(adminGuard, /verifyAdminAccess\(/, "guard should verify admin RBAC access");
    assert.match(adminGuard, /href="\/login"/, "guest state should route admins to login");
    assert.match(adminGuard, /Access denied/, "forbidden users should see an admin access denial");
    assert.match(adminClient, /\/admin\/brands\?page=1&page_size=1/, "RBAC probe should use an admin endpoint");
  });

  it("wires create product and publish actions to backend admin catalog APIs", () => {
    const productsPage = expectFile("src/features/admin/AdminProductsPage.tsx");
    const productForm = expectFile("src/features/admin/AdminProductFormPage.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(productsPage, /href="\/admin\/products\/new"/, "products list should link to create product");
    assert.match(productsPage, /fetchAdminProducts\(/, "products list should load products from backend admin API");
    assert.match(productsPage, /publishAdminProduct\(/, "products list should expose publish action");
    assert.match(productsPage, /archiveAdminProduct\(/, "products list should expose archive action for active products");
    assert.match(productForm, /createAdminProduct\(/, "product form should create products through admin API client");
    assert.match(productForm, /updateAdminProduct\(/, "product form should update existing products through admin API client");
    assert.match(productForm, /fetchAdminBrands\(/, "product form should load backend brand options");
    assert.match(productForm, /fetchAdminCategories\(/, "product form should load backend category options");
    assert.match(productForm, /router\.push\(`\/admin\/products\/\$\{product\.id\}\/edit`\)/, "created product should route to edit page");
    assert.match(adminClient, /"\/admin\/products"/, "create product client should post to admin products endpoint");
    assert.match(adminClient, /\/admin\/products\/\$\{encodeURIComponent\(productId\)\}\/publish/, "publish client should call backend publish endpoint");
  });

  it("keeps variant inventory adjustment path backend-owned", () => {
    const variantsPage = expectFile("src/features/admin/AdminVariantsPage.tsx");
    const variantForm = expectFile("src/features/admin/AdminVariantFormPage.tsx");
    const inventoryPage = expectFile("src/features/admin/AdminVariantInventoryPage.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(variantsPage, /href="\/admin\/variants\/new"/, "variants list should link to create variant");
    assert.match(variantsPage, /href=\{`\/admin\/variants\/\$\{variant\.id\}\/inventory`\}/, "variants list should link to inventory adjustment route");
    assert.match(variantForm, /createAdminVariant\(/, "variant form should create variants through admin API client");
    assert.match(variantForm, /updateAdminVariant\(/, "variant form should update variants through admin API client");
    assert.match(inventoryPage, /fetchAdminVariant\(variantId\)/, "inventory route should load the selected variant");
    assert.match(inventoryPage, /<InventoryPreparationPanel \/>/, "inventory route should render the adjustment workflow panel");
    assert.match(variantForm, /backend inventory endpoint/, "inventory adjustment messaging should keep stock mutations backend-owned");
    assert.match(variantForm, /reservations,[\s\S]*audit records,[\s\S]*oversell protection/, "inventory messaging should preserve stock safety constraints");
    assert.match(adminClient, /"\/admin\/variants"/, "create variant client should post to admin variants endpoint");
    assert.match(adminClient, /\/admin\/variants\/\$\{encodeURIComponent\(variantId\)\}/, "variant client should fetch/update specific variants");
  });

  it("wires order list, detail, and workflow actions to backend admin order APIs", () => {
    const ordersPage = expectFile("src/features/admin/AdminOrdersPage.tsx");
    const orderDetailPage = expectFile("src/features/admin/AdminOrderDetailPage.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(ordersPage, /fetchAdminOrders\(/, "orders list should load backend admin orders");
    assert.match(ordersPage, /href=\{`\/admin\/orders\/\$\{order\.order_code\}`\}/, "orders list should link each order to detail");
    assert.match(orderDetailPage, /fetchAdminOrder\(orderCode\)/, "order detail should load the selected backend order");
    assert.match(orderDetailPage, /runAdminOrderWorkflow\(/, "order detail should submit workflow actions to backend");
    ["confirm", "ship", "deliver", "cancel", "refund"].forEach((action) => {
      assert.match(orderDetailPage, new RegExp(`action: "${action}"`), `order detail should expose ${action} action`);
    });
    assert.match(adminClient, /\/admin\/orders\?page=\$\{input\.page\}&page_size=\$\{input\.pageSize\}/, "orders client should call paginated admin orders endpoint");
    assert.match(adminClient, /\/admin\/orders\/\$\{encodeURIComponent\(orderCode\)\}/, "order detail client should call admin order detail endpoint");
    assert.match(adminClient, /\/admin\/orders\/\$\{encodeURIComponent\(orderCode\)\}\/\$\{action\}/, "workflow client should call backend order action endpoint");
  });
});
