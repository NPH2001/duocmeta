import type { Metadata } from "next";

import { CheckoutPage } from "features/checkout/CheckoutPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Thanh toán | ${siteName}`,
  description: "Nhập thông tin khách hàng, giao hàng và thanh toán.",
  robots: noIndexRobots,
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
