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
  it("builds admin media URLs without localhost fallback", () => {
    const adminClient = expectFile("src/lib/admin.ts");
    const mediaHelper = expectFile("src/lib/media.ts");

    assert.match(adminClient, /buildMediaUrlFromStorageKey\(storageKey, process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/, "admin media URLs should reuse shared helper and avoid hardcoded localhost fallback");
    assert.match(mediaHelper, /return `\/media\/\$\{encodedStorageKey\}`;/, "shared media helper should default to same-origin media paths");
  });

  it("keeps protected admin routes present for the smoke path", () => {
    [
      "src/app/api/internal/revalidate-catalog/route.ts",
      "src/app/admin/layout.tsx",
      "src/app/admin/page.tsx",
      "src/app/admin/products/page.tsx",
      "src/app/admin/categories/page.tsx",
      "src/app/admin/products/new/page.tsx",
      "src/app/admin/products/[productId]/edit/page.tsx",
      "src/app/admin/variants/page.tsx",
      "src/app/admin/variants/new/page.tsx",
      "src/app/admin/variants/[variantId]/edit/page.tsx",
      "src/app/admin/variants/[variantId]/inventory/page.tsx",
      "src/app/admin/orders/page.tsx",
      "src/app/admin/orders/[orderCode]/page.tsx",
      "src/app/admin/cms/page.tsx",
      "src/app/admin/cms/posts/page.tsx",
      "src/app/admin/cms/posts/new/page.tsx",
      "src/app/admin/cms/posts/[id]/edit/page.tsx",
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
    assert.match(adminGuard, /Không có quyền truy cập/, "forbidden users should see an admin access denial");
    assert.match(adminClient, /\/admin\/brands\?page=1&page_size=1/, "RBAC probe should use an admin endpoint");
    assert.match(adminClient, /refreshSession/, "admin API requests should refresh expired access tokens");
    assert.match(adminClient, /SESSION_EXPIRED/, "expired admin sessions should show a friendly login-required error");
  });

  it("wires admin category management to backend category APIs", () => {
    const adminLayout = expectFile("src/features/admin/AdminLayout.tsx");
    const categoriesPage = expectFile("src/features/admin/AdminCategoriesPage.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(adminLayout, /href: "\/admin\/categories"/, "admin navigation should include category management");
    assert.match(categoriesPage, /fetchAdminCategoriesPage\(/, "categories page should load categories from backend admin API");
    assert.match(categoriesPage, /createAdminCategory\(/, "categories page should create categories through admin API client");
    assert.match(categoriesPage, /deleteAdminCategory\(/, "categories page should delete categories through admin API client");
    assert.match(categoriesPage, /Dữ liệu được lưu trực tiếp ở backend\/database/, "categories page should explain persistence boundary");
    assert.match(adminClient, /"\/admin\/categories"/, "admin client should call backend categories endpoint");
    assert.match(adminClient, /method: "DELETE"/, "admin client should support deleting categories");
    assert.match(adminClient, /response\.status === 204/, "admin client should handle empty 204 delete responses");
  });

  it("wires create product and publish actions to backend admin catalog APIs", () => {
    const productsPage = expectFile("src/features/admin/AdminProductsPage.tsx");
    const productForm = expectFile("src/features/admin/AdminProductFormPage.tsx");
    const adminClient = expectFile("src/lib/admin.ts");
    const revalidateRoute = expectFile("src/app/api/internal/revalidate-catalog/route.ts");

    assert.match(productsPage, /href="\/admin\/products\/new"/, "products list should link to create product");
    assert.match(productsPage, /fetchAdminProducts\(/, "products list should load products from backend admin API");
    assert.match(productsPage, /publishAdminProduct\(/, "products list should expose publish action");
    assert.match(productsPage, /archiveAdminProduct\(/, "products list should expose archive action for active products");
    assert.match(productsPage, /deleteAdminProduct\(/, "products list should expose delete action through admin API client");
    assert.match(productsPage, /window\.confirm/, "products list should confirm destructive deletion");
    assert.match(productsPage, /Xóa/, "products list should render a delete button");
    assert.match(productsPage, /product\.images\.find/, "products list should render backend-owned product images");
    assert.match(productsPage, /unoptimized/, "admin product thumbnails should bypass Next optimizer for backend media files");
    assert.match(productForm, /createAdminProduct\(/, "product form should create products through admin API client");
    assert.match(productForm, /updateAdminProduct\(/, "product form should update existing products through admin API client");
    assert.match(productForm, /publishAdminProduct\(/, "product form should let admins publish immediately after saving");
    assert.match(productForm, /fetchAdminBrands\(/, "product form should load backend brand options");
    assert.match(productForm, /fetchAdminCategories\(/, "product form should load backend category options");
    assert.match(productForm, /AdminMediaUploader/, "product form should reuse admin media upload flow");
    assert.match(productForm, /primary_image_media_id/, "product form should persist a backend-owned primary image media id");
    assert.match(productForm, /Gợi ý danh mục phù hợp/, "product form should show category recommendations");
    assert.match(productForm, /Tìm danh mục để thêm/, "product form should use search-driven category selection");
    assert.match(productForm, /Chỉ hiển thị tối đa 8 kết quả gần nhất/, "product form should avoid rendering the full category list at once");
    assert.match(productForm, /buildCategoryRecommendations\(/, "product form should derive category recommendations from backend metadata");
    assert.match(productForm, /applyCategoryRecommendation\(/, "product form should let admins apply a recommended category");
    assert.match(productForm, /Danh sách thuốc theo danh mục/, "product form should show category-specific medicine suggestions");
    assert.match(productForm, /classification\.group_label/, "product form should show normalized category classifications");
    assert.match(productForm, /medicine_suggestions/, "product form should consume backend medicine suggestion lists");
    assert.match(productForm, /allowed_product_types/, "product form should constrain product types by category metadata");
    assert.match(productForm, /product\.categories/, "edit form should restore saved product category assignments");
    assert.match(productForm, /selectedPrimaryImage/, "edit form should restore the selected primary image preview");
    assert.match(productForm, /Lưu nháp/, "product form should keep draft-saving explicit");
    assert.match(productForm, /Thêm và đăng bán|Lưu và đăng bán/, "product form should expose a direct publish action");
    assert.match(productForm, /Chỉ sản phẩm active đã đăng bán mới hiển thị ở storefront/, "product form should explain storefront visibility rules");
    assert.match(productForm, /router\.push\(`\/admin\/products\/\$\{product\.id\}\/edit`\)/, "created product should route to edit page");
    assert.match(adminClient, /"\/admin\/products"/, "create product client should post to admin products endpoint");
    assert.match(adminClient, /\/admin\/products\/\$\{encodeURIComponent\(productId\)\}\/publish/, "publish client should call backend publish endpoint");
    assert.match(adminClient, /export async function deleteAdminProduct\(productId: string\)/, "admin client should expose a dedicated delete product helper");
    assert.match(adminClient, /\/admin\/products\/\$\{encodeURIComponent\(productId\)\}/, "delete product client should target the backend product endpoint");
    assert.match(adminClient, /revalidatePublicCatalog\(/, "admin catalog mutations should invalidate storefront catalog cache");
    assert.match(adminClient, /classification: AdminCategoryClassification/, "admin client should type category classification metadata");
    assert.match(adminClient, /buildAdminMediaUrl/, "admin client should expose a helper to render uploaded media URLs");
    assert.match(revalidateRoute, /revalidateTag\(publicCatalogCacheTag\)/, "revalidate route should invalidate the shared storefront catalog tag");
    assert.match(revalidateRoute, /\/admin\/brands\?page=1&page_size=1/, "revalidate route should verify admin access against backend RBAC");
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
    assert.match(variantForm, /endpoint tồn kho của backend/, "inventory adjustment messaging should keep stock mutations backend-owned");
    assert.match(variantForm, /đặt giữ hàng/, "inventory messaging should preserve stock safety constraints");
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

  it("wires CMS post writing and publishing to backend-owned APIs", () => {
    const cmsLists = expectFile("src/features/admin/AdminCmsLists.tsx");
    const cmsForms = expectFile("src/features/admin/AdminCmsForms.tsx");
    const adminClient = expectFile("src/lib/admin.ts");

    assert.match(cmsLists, /Viết bài mới/, "posts list should link to the writing form");
    assert.match(cmsLists, /publishAdminPost\(/, "posts list should expose a publish action");
    assert.match(cmsLists, /href=\{publicHref\}/, "published posts should link to the public blog detail");
    assert.match(cmsForms, /Nội dung bài viết/, "post form should provide a friendly writing textarea");
    assert.match(cmsForms, /bodyToContentBlocks\(/, "post form should convert body text into content blocks");
    assert.match(cmsForms, /contentBlocksToBody\(/, "post form should load existing content blocks back into editable text");
    assert.match(cmsForms, /parseTagIds\(/, "post form should validate tag UUIDs before sending to backend");
    assert.match(cmsForms, /UUID thẻ hợp lệ/, "post form should explain that tag IDs are optional UUID values");
    assert.match(cmsForms, /value="publish"/, "post form should include a publish submit action");
    assert.match(cmsForms, /publishAdminPost\(resource\.id\)/, "publish submit should call the backend publish endpoint");
    assert.match(adminClient, /\/admin\/posts\/\$\{encodeURIComponent\(postId\)\}\/publish/, "publish post client should call backend publish endpoint");
  });
});
