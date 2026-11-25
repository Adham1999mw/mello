import type { Locale } from "@/i18n/config";

// Prices are stored in Egyptian pounds. Arabic: "١٬٢٠٠ ج.م.‏", English: "EGP 1,200".
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}
