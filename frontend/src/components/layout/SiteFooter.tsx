"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

const footerLinks: TranslationKey[] = [
  "footer.shipping",
  "footer.returns",
  "footer.privacy",
  "footer.terms",
  "footer.contact",
];

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-stone-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
            {t("footer.kicker")}
          </p>
          <p className="text-sm leading-6 text-stone-300">{t("footer.description")}</p>
        </div>

        <nav aria-label={t("footer.aria")} className="flex flex-wrap gap-4 text-sm text-stone-300">
          {footerLinks.map((labelKey) => (
            <Link key={labelKey} href="/" className="transition hover:text-white">
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
