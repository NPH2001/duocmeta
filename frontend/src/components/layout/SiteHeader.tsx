"use client";

import Link from "next/link";

import { AuthStatus } from "features/auth/AuthStatus";
import { LanguageSwitcher } from "features/i18n/LanguageSwitcher";
import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

const navItems: Array<{ href: string; labelKey: TranslationKey }> = [
  { href: "/", labelKey: "nav.home" },
  { href: "/products", labelKey: "nav.products" },
  { href: "/categories", labelKey: "nav.categories" },
  { href: "/cart", labelKey: "nav.cart" },
  { href: "/account", labelKey: "nav.account" },
  { href: "/brands", labelKey: "nav.brands" },
  { href: "/blog", labelKey: "nav.blog" },
];

export function SiteHeader() {
  const { t } = useLanguage();

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:flex-nowrap lg:gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold uppercase tracking-[0.35em] text-stone-900">
            Duocmeta
          </Link>
          <nav aria-label={t("nav.primary")} className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <form className="order-3 flex w-full items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 lg:order-none lg:max-w-sm">
          <input
            type="search"
            placeholder={t("nav.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            {t("nav.search")}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
