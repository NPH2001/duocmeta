"use client";

import { locales, type Locale } from "lib/i18n";

import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-1 py-1" aria-label={t("language.label")}>
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          aria-label={`${t("language.switchTo")}: ${getOptionLabel(option)}`}
          onClick={() => setLocale(option)}
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition",
            locale === option ? "bg-stone-950 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
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
