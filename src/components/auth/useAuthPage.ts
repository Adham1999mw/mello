import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useCustomerSession } from "@/lib/auth";
import { safeNext } from "@/lib/auth/form";

export const AUTH_TITLE_ID = "auth-title";

export type AuthTab = "signIn" | "signUp";

/**
 * Address of the sign-in page (sign in and sign up share one page, switched by tabs):
 *   /en/sign-in/                         sign in
 *   /en/sign-in/?tab=sign-up             sign up, step 1
 *   /en/sign-in/?tab=sign-up&step=2      sign up, step 2
 * `next` is kept on every one.
 */
export function authHref(locale: string, { tab = "signIn", step, next }: { tab?: AuthTab; step?: 1 | 2; next?: string | null }) {
  const params = new URLSearchParams();
  if (tab === "signUp") params.set("tab", "sign-up");
  if (tab === "signUp" && step === 2) params.set("step", "2");
  if (next) params.set("next", next);
  const query = params.toString();
  return localePath(locale as Parameters<typeof localePath>[0], query ? `/sign-in?${query}` : "/sign-in");
}

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
export function useFocusTitle(key: unknown, titleId = AUTH_TITLE_ID, enabled = true) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!enabled) return;
    document.getElementById(titleId)?.focus();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
