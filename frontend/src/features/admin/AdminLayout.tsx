import Link from "next/link";
import type { ReactNode } from "react";

import { AdminAuthGuard } from "features/admin/AdminAuthGuard";

const adminNavItems = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/variants", label: "Phiên bản" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/coupons", label: "Mã giảm giá" },
  { href: "/admin/cms", label: "Bài viết / CMS" },
  { href: "/admin/media", label: "Thư viện ảnh" },
  { href: "/admin/settings", label: "Cài đặt" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-[calc(100vh-192px)] bg-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-emerald-100 bg-emerald-950 p-5 text-emerald-50">
            <Link href="/admin" className="text-lg font-semibold uppercase tracking-[0.24em]">
              Quản trị
            </Link>
            <nav aria-label="Quản trị" className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
              {adminNavItems.map((item) => (
                <Link
                  className={[
                    "min-w-fit rounded-xl px-4 py-3 text-sm font-medium text-emerald-100",
                    "hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
