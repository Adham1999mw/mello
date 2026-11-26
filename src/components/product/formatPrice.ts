import type { Locale } from "@/i18n/config";

// Prices are stored in Egyptian pounds. Arabic: "١٬٢٠٠ ج.م.‏", English: "EGP 1,200".
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// A whole percent: 20 → Arabic "٢٠٪", English "20%".
export function formatPercent(percent: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(percent / 100);
}

// A plain whole number: 3 → Arabic "٣", English "3" (photo counters, review counts).
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { maximumFractionDigits: 0 }).format(value);
}
