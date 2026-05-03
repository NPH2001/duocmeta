export type ContactChannel = "phone" | "zalo" | "messenger";

export type ContactLink = {
  channel: ContactChannel;
  href: string;
  testId: string;
};

const defaultPhoneHref = "tel:+84123456789";
const defaultZaloHref = "https://zalo.me/84123456789";
const defaultMessengerHref = "https://m.me/duocmeta";

export const contactLinks: ContactLink[] = [
  {
    channel: "phone",
    href: process.env.NEXT_PUBLIC_CONTACT_PHONE_HREF ?? defaultPhoneHref,
    testId: "floating-contact-phone",
  },
  {
    channel: "zalo",
    href: process.env.NEXT_PUBLIC_CONTACT_ZALO_HREF ?? defaultZaloHref,
    testId: "floating-contact-zalo",
  },
  {
    channel: "messenger",
    href: process.env.NEXT_PUBLIC_CONTACT_MESSENGER_HREF ?? defaultMessengerHref,
    testId: "floating-contact-messenger",
  },
];
