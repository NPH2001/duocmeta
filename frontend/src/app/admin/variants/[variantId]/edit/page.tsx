import { AdminVariantFormPage } from "features/admin/AdminVariantFormPage";

type AdminVariantEditRouteProps = {
  params: Promise<{
    variantId: string;
  }>;
};

export default async function AdminVariantEditRoute({ params }: AdminVariantEditRouteProps) {
  const { variantId } = await params;

  return <AdminVariantFormPage mode="edit" variantId={decodeURIComponent(variantId)} />;
}
