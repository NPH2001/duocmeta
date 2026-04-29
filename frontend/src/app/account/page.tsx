import type { Metadata } from "next";

import { AccountOverviewPage } from "features/account/AccountOverviewPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Account | ${siteName}`,
  description: "Customer account overview.",
  robots: noIndexRobots,
};

export default function AccountRoute() {
  return <AccountOverviewPage />;
}
