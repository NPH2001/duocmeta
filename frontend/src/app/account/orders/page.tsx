import type { Metadata } from "next";

import { OrderHistoryPage } from "features/account/OrderHistoryPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Order History | ${siteName}`,
  description: "Customer order history.",
  robots: noIndexRobots,
};

export default function OrdersRoute() {
  return <OrderHistoryPage />;
}
