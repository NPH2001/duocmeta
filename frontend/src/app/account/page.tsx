import type { Metadata } from "next";

import { AccountOverviewPage } from "features/account/AccountOverviewPage";
import { siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Account | ${siteName}`,
  description: "Customer account overview.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AccountRoute() {
  return <AccountOverviewPage />;
}
