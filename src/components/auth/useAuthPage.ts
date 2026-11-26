import { useEffect, useRef } from "react";
import { localePath } from "@/i18n/static";

export const AUTH_TITLE_ID = "auth-title";

export type AuthTab = "signIn" | "signUp";

/** Where she goes after signing in or creating an account. */
export const AFTER_AUTH_PATH = "/";

/**
 * Address of the sign-in page (sign in and sign up share one page, switched by tabs):
 *   /en/sign-in/                         sign in
 *   /en/sign-in/?tab=sign-up             sign up
 */
export function authHref(locale: string, { tab = "signIn" }: { tab?: AuthTab } = {}) {
  const params = new URLSearchParams();
  if (tab === "signUp") params.set("tab", "sign-up");
  const query = params.toString();
  return localePath(locale as Parameters<typeof localePath>[0], query ? `/sign-in?${query}` : "/sign-in");
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
