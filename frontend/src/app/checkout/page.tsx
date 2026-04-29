import type { Metadata } from "next";

import { CheckoutPage } from "features/checkout/CheckoutPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Checkout | ${siteName}`,
  description: "Enter customer, shipping, and payment details for checkout.",
  robots: noIndexRobots,
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
