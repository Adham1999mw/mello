import { useEffect } from "react";
import { useRouter } from "next/router";
import { localePath } from "@/i18n/static";
import { useLocale } from "@/i18n/useLocale";
import { formatPhone, phoneDigits } from "@/lib/auth/form";
import { useCustomer } from "@/store/hooks";

// The signed-in customer for the account pages. A guest is sent to sign in (in the browser).
// `ready` is false until the session and profile are known.
export function useAccount() {
  const router = useRouter();
  const locale = useLocale();
  const customer = useCustomer();

  useEffect(() => {
    if (customer.status === "signedOut") router.replace(localePath(locale, "/sign-in"));
  }, [customer.status, router, locale]);

  const ready = customer.status === "signedIn" && customer.profileStatus !== "loading" && customer.profileStatus !== "idle";
  return { ...customer, ready };
}

/** "Salma Ahmed" -> "SA", "سلمى أحمد" -> "سأ". */
export function initials(fullName: string | null | undefined): string {
  return (fullName ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
}

/** "01012345678" -> "+20 10 1234 5678". */
export function displayPhone(phone: string | null | undefined): string {
  return phone ? `+20 ${formatPhone(phoneDigits(phone))}` : "";
}

/** "2026-11-25T..." -> "November 2026" / "نوفمبر ٢٠٢٦". */
export function memberSince(createdAt: string | undefined, locale: string): string {
  if (!createdAt) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" }).format(new Date(createdAt));
}
