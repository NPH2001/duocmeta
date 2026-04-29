import type { Metadata } from "next";

import { OrderDetailPage } from "features/account/OrderDetailPage";
import { noIndexRobots, siteName } from "lib/seo";

type OrderDetailRouteProps = {
  params: Promise<{
    orderCode: string;
  }>;
};

export async function generateMetadata({ params }: OrderDetailRouteProps): Promise<Metadata> {
  const { orderCode } = await params;

  return {
    title: `${orderCode} | Order Detail | ${siteName}`,
    description: "Customer order detail.",
    robots: noIndexRobots,
  };
}

export default async function OrderDetailRoute({ params }: OrderDetailRouteProps) {
  const { orderCode } = await params;

  return <OrderDetailPage orderCode={decodeURIComponent(orderCode)} />;
}
