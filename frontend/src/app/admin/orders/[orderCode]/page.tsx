import { AdminOrderDetailPage } from "features/admin/AdminOrderDetailPage";

type AdminOrderDetailRouteProps = {
  params: Promise<{
    orderCode: string;
  }>;
};

export default async function AdminOrderDetailRoute({ params }: AdminOrderDetailRouteProps) {
  const { orderCode } = await params;

  return <AdminOrderDetailPage orderCode={decodeURIComponent(orderCode)} />;
}
