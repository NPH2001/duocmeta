import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPublicMetadata, noIndexRobots } from "lib/seo";

export function generateMetadata(): Metadata {
  return {
    ...buildPublicMetadata({
      title: "Đăng ký đã tắt",
      description: "Duocmeta không mở đăng ký tài khoản khách hàng trên storefront.",
      path: "/register",
    }),
    robots: noIndexRobots,
  };
}

export default function RegisterPage() {
  redirect("/");
}
