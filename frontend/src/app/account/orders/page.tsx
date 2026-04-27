import type { Metadata } from "next";

import { OrderHistoryPage } from "features/account/OrderHistoryPage";
import { siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Order History | ${siteName}`,
  description: "Customer order history.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function OrdersRoute() {
  return <OrderHistoryPage />;
}
