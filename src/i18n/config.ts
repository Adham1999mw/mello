// Keep in sync with `i18n.locales` in next.config.ts.
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const rtlLocales: readonly Locale[] = ["ar"];

export function toLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
