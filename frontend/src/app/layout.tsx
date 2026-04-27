import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SiteFooter } from "components/layout/SiteFooter";
import { SiteHeader } from "components/layout/SiteHeader";
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
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
