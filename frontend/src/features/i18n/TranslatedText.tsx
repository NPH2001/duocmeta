"use client";

import type { TranslationKey } from "lib/i18n";

import { useLanguage } from "./LanguageProvider";

export function TranslatedText({ id }: { id: TranslationKey }) {
  const { t } = useLanguage();
  return <>{t(id)}</>;
}
