import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPublicMetadata, noIndexRobots } from "lib/seo";

export function generateMetadata(): Metadata {
  return {
    ...buildPublicMetadata({
      title: "Khôi phục mật khẩu quản trị",
      description: "Luồng khôi phục mật khẩu khách hàng đã tắt; quản trị viên dùng kênh nội bộ để được hỗ trợ.",
      path: "/forgot-password",
    }),
    robots: noIndexRobots,
  };
}

export default function ForgotPasswordPage() {
  redirect("/login");
}
