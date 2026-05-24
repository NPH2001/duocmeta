import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

export type SocialBrand =
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "messenger"
  | "zalo";

type SocialBrandIconProps = Omit<ComponentPropsWithoutRef<typeof Image>, "src" | "alt" | "width" | "height"> & {
  brand: SocialBrand;
};

const brandImageSrc: Record<SocialBrand, string> = {
  facebook: "/icons/social/facebook.png",
  instagram: "/icons/social/instagram.png",
  youtube: "/icons/social/youtube.png",
  tiktok: "/icons/social/tiktok.png",
  linkedin: "/icons/social/linkedin.png",
  messenger: "/icons/social/messenger.png",
  zalo: "/icons/social/zalo.png",
};

export function SocialBrandIcon({ brand, className, sizes, ...props }: SocialBrandIconProps) {
  return (
    <Image
      src={brandImageSrc[brand]}
      alt=""
      aria-hidden="true"
      className={className}
      width={48}
      height={48}
      sizes={sizes ?? "48px"}
      {...props}
    />
  );
}
