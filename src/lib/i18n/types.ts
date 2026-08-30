export type Locale = "en" | "zh" | "fr" | "es" | "nl";

export type Messages = Record<string, Record<string, string>>;

export type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;
