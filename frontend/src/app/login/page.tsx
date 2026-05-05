import type { Metadata } from "next";

import { AuthPageShell } from "features/auth/AuthPageShell";
import { LoginForm } from "features/auth/AuthForms";
import { buildPublicMetadata, noIndexRobots } from "lib/seo";

export function generateMetadata(): Metadata {
  return {
    ...buildPublicMetadata({
    title: "Đăng nhập quản trị",
    description: "Đăng nhập dành riêng cho quản trị viên Duocmeta.",
    path: "/login",
    }),
    robots: noIndexRobots,
  };
}

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="Khu vực quản trị"
      title="Đăng nhập để quản lý bài viết và sản phẩm."
      description="Trang này chỉ dành cho quản trị viên có quyền backend RBAC. Khách hàng không cần đăng nhập để xem sản phẩm hoặc đọc bài viết."
      footerLabel="Bạn là khách hàng?"
      footerHref="/"
      footerCta="Quay lại trang chủ"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
