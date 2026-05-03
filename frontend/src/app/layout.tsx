import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SiteFooter } from "components/layout/SiteFooter";
import { SiteHeader } from "components/layout/SiteHeader";
import { FloatingContactButtons } from "features/contact/FloatingContactButtons";
import { FrontendErrorTracking } from "features/error-tracking/FrontendErrorTracking";
import { LanguageProvider } from "features/i18n/LanguageProvider";
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FrontendErrorTracking />
        <LanguageProvider>
          <div className="min-h-screen">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <FloatingContactButtons />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
