import type { Metadata } from "next";

import { CheckoutPage } from "features/checkout/CheckoutPage";
import { siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Checkout | ${siteName}`,
  description: "Enter customer, shipping, and payment details for checkout.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
