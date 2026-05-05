import type { Metadata } from "next";

import { OrderSuccessPage } from "features/checkout/OrderSuccessPage";
import { noIndexRobots, siteName } from "lib/seo";

type SuccessRouteProps = {
  searchParams: Promise<{
    order_code?: string;
  }>;
};

export const metadata: Metadata = {
  title: `Đặt hàng thành công | ${siteName}`,
  description: "Trang xác nhận đơn hàng.",
  robots: noIndexRobots,
};

export default async function SuccessRoute({ searchParams }: SuccessRouteProps) {
  const { order_code: orderCode } = await searchParams;

  return <OrderSuccessPage orderCode={orderCode} />;
}
