import Link from "next/link";
import { initials } from "@/components/account/useAccount";
import { cn, typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useCustomer } from "@/store/hooks";

// Account entry in the site header, between search and the bag. Takes the header's text color
// (cream on the homepage hero, burgundy on the ivory bar).
//   Guest      person icon -> /sign-in/. From md a small "Sign in" label next to it.
//   Signed in  her initials in a thin circle -> /account/.
// While the session is still loading it shows the plain icon, so nothing jumps.
export default function HeaderAccount() {
  const { t, locale } = useTranslation();
  const { status, profile, user } = useCustomer();
  const signedIn = status === "signedIn";
  const letters = signedIn ? initials(profile?.full_name || user?.email) : "";

  return (
    <Link
      href={localePath(locale, signedIn ? "/account" : "/sign-in")}
      aria-label={signedIn ? t("nav.account") : t("nav.signIn")}
      className="-mx-0.5 -my-[11px] flex min-h-11 min-w-11 items-center justify-center gap-2 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:px-1"
    >
      {letters ? (
        <span
          aria-hidden="true"
          className="grid size-[26px] place-items-center rounded-full border border-current font-display text-[12px] leading-none rtl:text-[13px] rtl:font-medium"
        >
          {letters}
        </span>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
        </svg>
      )}
      {status === "signedOut" && (
        <span aria-hidden="true" className={cn(typography("label"), "hidden md:inline")}>
          {t("nav.signIn")}
        </span>
      )}
    </Link>
  );
}
