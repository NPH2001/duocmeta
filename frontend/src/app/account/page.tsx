import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Tài khoản khách hàng đã tắt | ${siteName}`,
  description: "Duocmeta không yêu cầu tài khoản khách hàng trên storefront.",
  robots: noIndexRobots,
};

export default function AccountRoute() {
  redirect("/");
}
