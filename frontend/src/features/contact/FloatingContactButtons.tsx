"use client";

import { SocialBrandIcon } from "components/icons/SocialBrandIcon";
import { useLanguage } from "features/i18n/LanguageProvider";
import { contactLinks, type ContactChannel } from "lib/contact";
import type { TranslationKey } from "lib/i18n";

const contactLabelKeys: Record<ContactChannel, TranslationKey> = {
  phone: "contact.phone",
  zalo: "contact.zalo",
  messenger: "contact.messenger",
};

const contactClassNames: Record<ContactChannel, string> = {
  phone: "bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500",
  zalo: "bg-white ring-1 ring-[#0068FF]/20 hover:ring-[#0068FF]/40 focus-visible:ring-[#0068FF]",
  messenger: "bg-white ring-1 ring-[#0084FF]/20 hover:ring-[#0084FF]/40 focus-visible:ring-[#0084FF]",
};

export function FloatingContactButtons() {
  const { t } = useLanguage();

  return (
    <aside
      aria-label={t("contact.ariaLabel")}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden"
    >
      {contactLinks.map((link) => {
        const label = t(contactLabelKeys[link.channel]);

        return (
          <a
            key={link.channel}
            href={link.href}
            data-testid={link.testId}
            aria-label={label}
            title={label}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            className={[
              "group inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-lg",
              "shadow-emerald-950/20 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-white md:h-14 md:w-14",
              contactClassNames[link.channel],
            ].join(" ")}
          >
            <ContactChannelIcon channel={link.channel} />
            <span className="sr-only">{label}</span>
          </a>
        );
      })}
    </aside>
  );
}

function ContactChannelIcon({ channel }: { channel: ContactChannel }) {
  if (channel === "phone") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="none">
        <path
          d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.37 1.03-.25 1.13.37 2.35.57 3.56.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.21.2 2.43.57 3.56.11.36.03.75-.25 1.03l-2.2 2.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (channel === "zalo") {
    return <SocialBrandIcon brand="zalo" className="h-full w-full object-cover" />;
  }

  return <SocialBrandIcon brand="messenger" className="h-full w-full object-cover" />;
}
