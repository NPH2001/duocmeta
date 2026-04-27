import { AdminVariantInventoryPage } from "features/admin/AdminVariantInventoryPage";

type AdminVariantInventoryRouteProps = {
  params: Promise<{
    variantId: string;
  }>;
};

export default async function AdminVariantInventoryRoute({ params }: AdminVariantInventoryRouteProps) {
  const { variantId } = await params;

  return <AdminVariantInventoryPage variantId={decodeURIComponent(variantId)} />;
}
