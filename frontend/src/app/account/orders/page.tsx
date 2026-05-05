import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Lịch sử đơn hàng đã tắt | ${siteName}`,
  description: "Duocmeta không hiển thị lịch sử đơn hàng qua tài khoản khách hàng trên storefront.",
  robots: noIndexRobots,
};

export default function OrdersRoute() {
  redirect("/");
}
