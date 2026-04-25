import type { Metadata } from "next";

import { HomePage } from "features/home/HomePage";


export const metadata: Metadata = {
  title: "Duocmeta | Homepage",
  description: "SEO-first ecommerce homepage shell for the Duocmeta storefront.",
};

export const revalidate = 3600;


export default function HomePageRoute() {
  return <HomePage />;
}
