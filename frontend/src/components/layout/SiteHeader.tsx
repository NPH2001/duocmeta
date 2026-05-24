"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import type { PublicCategoryListItem } from "lib/catalog";
import type { TranslationKey } from "lib/i18n";

const navItems: Array<{ href: string; labelKey?: TranslationKey; label?: string }> = [
  { href: "/", labelKey: "nav.home" },
  { href: "/pages/gioi-thieu", label: "Giới thiệu" },
  { href: "/products", labelKey: "nav.products" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/pages/chuoi-cua-hang", label: "Chuỗi cửa hàng" },
];

export function SiteHeader({ categories = [] }: { categories?: PublicCategoryListItem[] }) {
  const { t } = useLanguage();

  const categoryNav = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: category.name,
  }));

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_8px_30px_rgba(15,118,110,0.08)]">
      <div className="bg-emerald-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs font-medium md:px-6">
          <p>Hotline tư vấn: 0123.456.789 • Email: hotro@duocmeta.vn</p>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="hover:text-emerald-100">
              Góc sức khỏe
            </Link>
            <Link href="/login" className="hover:text-emerald-100">
              Quản trị
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:px-6 lg:grid-cols-[260px_1fr_260px] lg:items-center">
        <Link href="/" className="flex items-center gap-3" aria-label="Duocmeta">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-100">
            D+
          </span>
          <span>
            <span className="block text-2xl font-bold uppercase tracking-[0.08em] text-emerald-800">Duocmeta</span>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">Nhà thuốc trực tuyến</span>
          </span>
        </Link>

        <form className="flex w-full items-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 shadow-inner shadow-white">
          <input
            type="search"
            placeholder={t("nav.searchPlaceholder")}
            className="min-h-12 w-full bg-transparent px-5 text-sm text-emerald-950 outline-none placeholder:text-emerald-600"
          />
          <button
            type="submit"
            className="m-1 min-h-10 rounded-full bg-emerald-600 px-5 text-sm font-bold uppercase tracking-[0.04em] text-white transition hover:bg-emerald-500"
          >
            {t("nav.search")}
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <Link href="/cart" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 hover:border-emerald-600">
            Giỏ hàng <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">0</span>
          </Link>
          <Link href="/login" className="rounded-full bg-lime-400 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-lime-200">
            Quản trị
          </Link>
        </div>
      </div>

      <nav aria-label={t("nav.primary")} className="border-t border-emerald-100 bg-emerald-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 md:px-6">
          <Link href="/categories" className="min-w-fit bg-lime-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.04em] text-emerald-950">
            Danh mục sản phẩm
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="min-w-fit px-3 py-3 text-sm font-semibold hover:bg-emerald-500">
              {item.labelKey ? t(item.labelKey) : item.label}
            </Link>
          ))}
        </div>
      </nav>

      {categoryNav.length > 0 ? (
        <div className="hidden border-b border-emerald-100 bg-white lg:block">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2 text-sm text-emerald-800">
            {categoryNav.map((item) => (
              <Link key={item.href} href={item.href} className="min-w-fit rounded-full px-4 py-2 font-medium hover:bg-emerald-50 hover:text-emerald-950">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
