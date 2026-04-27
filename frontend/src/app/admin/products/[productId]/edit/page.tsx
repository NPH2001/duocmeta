import { AdminProductFormPage } from "features/admin/AdminProductFormPage";

type AdminProductEditRouteProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function AdminProductEditRoute({ params }: AdminProductEditRouteProps) {
  const { productId } = await params;

  return <AdminProductFormPage mode="edit" productId={decodeURIComponent(productId)} />;
}
