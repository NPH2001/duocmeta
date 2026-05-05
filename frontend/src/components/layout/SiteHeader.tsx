"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { TranslationKey } from "lib/i18n";

const navItems: Array<{ href: string; labelKey: TranslationKey }> = [
  { href: "/", labelKey: "nav.home" },
  { href: "/products", labelKey: "nav.products" },
  { href: "/categories", labelKey: "nav.categories" },
  { href: "/cart", labelKey: "nav.cart" },
  { href: "/blog", labelKey: "nav.blog" },
];

export function SiteHeader() {
  const { t } = useLanguage();

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:flex-nowrap lg:gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold uppercase tracking-[0.35em] text-emerald-950">
            Duocmeta
          </Link>
          <nav aria-label={t("nav.primary")} className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-emerald-900/75 transition hover:text-emerald-950"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <form className="order-3 flex w-full items-center gap-3 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-3 lg:order-none lg:max-w-sm">
          <input
            type="search"
            placeholder={t("nav.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-emerald-950 outline-none placeholder:text-emerald-600"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            {t("nav.search")}
          </button>
        </form>

        <Link
          href="/login"
          className="hidden rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-950 hover:text-emerald-950 lg:inline-flex"
        >
          Quản trị
        </Link>
      </div>
    </header>
  );
}
