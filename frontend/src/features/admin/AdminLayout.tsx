import Link from "next/link";
import type { ReactNode } from "react";

import { AdminAuthGuard } from "features/admin/AdminAuthGuard";

const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/variants", label: "Variants" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-[calc(100vh-192px)] bg-stone-100">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-stone-200 bg-stone-950 p-5 text-stone-100">
            <Link href="/admin" className="text-lg font-semibold uppercase tracking-[0.24em]">
              Admin
            </Link>
            <nav aria-label="Admin" className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
              {adminNavItems.map((item) => (
                <Link
                  className={[
                    "min-w-fit rounded-xl px-4 py-3 text-sm font-medium text-stone-300",
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
