"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale, Messages, TranslateFunction } from "./types";
import enMessages from "../../../messages/en.json";
import zhMessages from "../../../messages/zh.json";
import frMessages from "../../../messages/fr.json";
import esMessages from "../../../messages/es.json";
import nlMessages from "../../../messages/nl.json";

const ALL_MESSAGES: Record<Locale, Messages> = {
  en: enMessages as Messages,
  zh: zhMessages as Messages,
  fr: frMessages as Messages,
  es: esMessages as Messages,
  nl: nlMessages as Messages,
};

const LOCALES: readonly Locale[] = ["en", "zh", "fr", "es", "nl"] as const;
const STORAGE_KEY = "petfoodsmart-locale";

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && LOCALES.includes(saved)) return saved;
  } catch {
    // localStorage may be unavailable
  }
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("nl")) return "nl";
  return "en";
}

interface I18nProviderProps {
  children: ReactNode;
  /** Override locale (useful for testing) */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  useEffect(() => {
    if (!initialLocale) {
      setLocaleState(detectLocale());
    }
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {
        // ignore
      }
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      messages: ALL_MESSAGES[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Resolve a dot-separated path in a nested object */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/** Interpolate {param} placeholders */
function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, val] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
  }
  return result;
}

/**
 * Translation hook. Falls back to English if no I18nProvider is present
 * (useful in tests — no wrapper needed).
 */
export function useTranslation(namespace?: string) {
  const context = useContext(I18nContext);
  const messages = context?.messages ?? (enMessages as Messages);
  const locale: Locale = context?.locale ?? "en";

  const t: TranslateFunction = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const value = getNestedValue(
        messages as Record<string, unknown>,
        fullKey,
      );
      if (!value) return fullKey; // Return key as fallback
      return params ? interpolate(value, params) : value;
    },
    [messages, namespace],
  );

  return { t, locale };
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  return context?.locale ?? "en";
}

export function useSetLocale(): (locale: Locale) => void {
  const context = useContext(I18nContext);
  return context?.setLocale ?? (() => {});
}
