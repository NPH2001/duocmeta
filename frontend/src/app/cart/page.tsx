import type { Metadata } from "next";

import { CartPage } from "features/cart/CartPage";
import { noIndexRobots, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: `Giỏ hàng | ${siteName}`,
  description: "Kiểm tra sản phẩm trong giỏ trước khi thanh toán.",
  robots: noIndexRobots,
};

export default function CartRoute() {
  return <CartPage />;
}
