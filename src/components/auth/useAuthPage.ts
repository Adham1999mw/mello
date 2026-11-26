import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useCustomerSession } from "@/lib/auth";
import { safeNext } from "@/lib/auth/form";

export const AUTH_TITLE_ID = "auth-title";

/**
 * Shared bits of every sign-in page:
 *   next      the safe `?next=` path (or null)
 *   withNext  a page path in the current locale that keeps `?next=` ("/sign-in" -> "/en/sign-in/?next=...")
 *   after     where to go when she is signed in (next, else the fallback)
 */
export function useAuthNext(fallback = "/account") {
  const router = useRouter();
  const { locale } = useTranslation();
  const next = safeNext(router.query.next);
  const withNext = (path: string) => localePath(locale, next ? `${path}?next=${encodeURIComponent(next)}` : path);
  const after = localePath(locale, next ?? fallback);
  return { next, withNext, after };
}

/** If she is already signed in when the page opens, send her on (checked once, not after a sign-in). */
export function useRedirectIfSignedIn(target: string) {
  const router = useRouter();
  const { status } = useCustomerSession();
  const checked = useRef(false);
  useEffect(() => {
    if (status === "loading" || checked.current) return;
    checked.current = true;
    if (status === "signedIn") router.replace(target);
  }, [status, router, target]);
}

/** Moves focus to the screen's title when `key` changes (not on first load), for screen readers. */
export function useFocusTitle(key: unknown) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById(AUTH_TITLE_ID)?.focus();
    window.scrollTo({ top: 0 });
  }, [key]);
}
