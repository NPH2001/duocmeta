"use client";

import { useLanguage } from "features/i18n/LanguageProvider";
import { contactLinks, type ContactChannel } from "lib/contact";
import type { TranslationKey } from "lib/i18n";

const contactLabelKeys: Record<ContactChannel, TranslationKey> = {
  phone: "contact.phone",
  zalo: "contact.zalo",
  messenger: "contact.messenger",
};

const contactClassNames: Record<ContactChannel, string> = {
  phone: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
  zalo: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500",
  messenger: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
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
              "group inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg",
              "shadow-stone-950/20 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-white md:h-14 md:w-14",
              contactClassNames[link.channel],
            ].join(" ")}
          >
            <ContactIcon channel={link.channel} />
            <span className="sr-only">{label}</span>
          </a>
        );
      })}
    </aside>
  );
}

function ContactIcon({ channel }: { channel: ContactChannel }) {
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
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 md:h-7 md:w-7" fill="none">
        <path
          d="M5.5 5.25h13A2.5 2.5 0 0 1 21 7.75v6.5a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 3v-3h-2A2.5 2.5 0 0 1 3 14.25v-6.5a2.5 2.5 0 0 1 2.5-2.5Z"
          fill="currentColor"
        />
        <path
          d="M6.2 14.1 9.1 9.9H6.35V8.55h5.05v1.05l-2.95 4.25h3.05v1.35H6.2v-1.1Zm6.3-5.55h1.45v6.65H12.5V8.55Zm3.1 0h1.45v2.2h1.85v1.35h-1.85v3.1H15.6V8.55Z"
          fill="white"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 md:h-7 md:w-7" fill="none">
      <path
        d="M12 3C6.98 3 3 6.78 3 11.44c0 2.65 1.29 5.01 3.31 6.56v3l3.02-1.66c.84.24 1.73.37 2.67.37 5.02 0 9-3.78 9-8.44S17.02 3 12 3Z"
        fill="currentColor"
      />
      <path d="m7.5 13.1 3-3.2 2.25 2.4 3.75-2.4-3 3.2-2.25-2.4-3.75 2.4Z" fill="white" />
    </svg>
  );
}
