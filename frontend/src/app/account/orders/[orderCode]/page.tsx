import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { noIndexRobots, siteName } from "lib/seo";

type OrderDetailRouteProps = {
  params: Promise<{
    orderCode: string;
  }>;
};

export async function generateMetadata({ params }: OrderDetailRouteProps): Promise<Metadata> {
  const { orderCode } = await params;

  return {
    title: `${orderCode} | Chi tiết đơn hàng đã tắt | ${siteName}`,
    description: "Duocmeta không hiển thị chi tiết đơn hàng qua tài khoản khách hàng trên storefront.",
    robots: noIndexRobots,
  };
}

export default function OrderDetailRoute() {
  redirect("/");
}
