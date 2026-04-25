import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SiteFooter } from "components/layout/SiteFooter";
import { SiteHeader } from "components/layout/SiteHeader";


export const metadata: Metadata = {
  title: "Duocmeta",
  description: "Production-grade ecommerce storefront foundation.",
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
