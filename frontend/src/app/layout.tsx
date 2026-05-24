import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SiteFooter } from "components/layout/SiteFooter";
import { SiteHeader } from "components/layout/SiteHeader";
import { FrontendErrorTracking } from "features/error-tracking/FrontendErrorTracking";
import { FloatingContactButtons } from "features/contact/FloatingContactButtons";
import { LanguageProvider } from "features/i18n/LanguageProvider";
import { fetchPublicCategories } from "lib/catalog";
import { buildPublicMetadata, siteUrl } from "lib/seo";

export const metadata: Metadata = {
  ...buildPublicMetadata({
    title: "Duocmeta",
    path: "/",
  }),
  metadataBase: new URL(siteUrl),
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const headerCategories = await getHeaderCategories();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <FrontendErrorTracking />
        <LanguageProvider>
          <div className="min-h-screen">
            <SiteHeader categories={headerCategories} />
            <main>{children}</main>
            <SiteFooter />
            <FloatingContactButtons />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}

async function getHeaderCategories() {
  try {
    const response = await fetchPublicCategories({ page: 1, pageSize: 50 });
    return response.data;
  } catch {
    return [];
  }
}
