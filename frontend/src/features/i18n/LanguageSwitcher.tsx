"use client";

import { locales, type Locale } from "lib/i18n";

import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-1 py-1" aria-label={t("language.label")}>
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          aria-label={`${t("language.switchTo")}: ${getOptionLabel(option)}`}
          onClick={() => setLocale(option)}
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition",
            locale === option ? "bg-emerald-600 text-white hover:bg-emerald-500" : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-950",
          ].join(" ")}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function getOptionLabel(locale: Locale) {
  return locale === "vi" ? "Tiếng Việt" : "English";
}
