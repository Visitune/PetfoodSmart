"use client";

import { useLocale, useSetLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const LANGUAGE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  fr: "FR",
  es: "ES",
  nl: "NL",
};

const LANGUAGE_OPTIONS: readonly Locale[] = ["en", "zh", "fr", "es", "nl"];

export function LanguageSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="fixed top-4 right-4 z-50 rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-neutral-300 backdrop-blur-sm transition-colors hover:border-neutral-500 hover:text-neutral-100"
      aria-label="Select language"
      data-testid="language-switcher"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {LANGUAGE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
