import { AdminCouponFormPage } from "features/admin/AdminCouponFormPage";

type AdminCouponEditRouteProps = {
  params: Promise<{
    couponId: string;
  }>;
};

export default async function AdminCouponEditRoute({ params }: AdminCouponEditRouteProps) {
  const { couponId } = await params;

  return <AdminCouponFormPage couponId={decodeURIComponent(couponId)} mode="edit" />;
}
