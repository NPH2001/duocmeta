import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminLayout } from "features/admin/AdminLayout";
import { siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Admin | ${siteName}`,
  description: "Commerce administration.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
