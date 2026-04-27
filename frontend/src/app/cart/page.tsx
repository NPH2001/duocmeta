import type { Metadata } from "next";

import { CartPage } from "features/cart/CartPage";
import { siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Cart | ${siteName}`,
  description: "Review cart items before checkout.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CartRoute() {
  return <CartPage />;
}
