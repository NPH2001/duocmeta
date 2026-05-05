import type { Metadata } from "next";

import { HomePage } from "features/home/HomePage";
import { buildPublicMetadata } from "lib/seo";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Duocmeta",
    description: "Nền tảng nhà thuốc trực tuyến Duocmeta.",
    path: "/",
  });
}

export default function Page() {
  return <HomePage />;
}
