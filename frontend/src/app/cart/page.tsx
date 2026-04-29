import type { Metadata } from "next";

import { CartPage } from "features/cart/CartPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Cart | ${siteName}`,
  description: "Review cart items before checkout.",
  robots: noIndexRobots,
};

export default function CartRoute() {
  return <CartPage />;
}
