import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { localePath } from "@/i18n/static";
import { useLocale } from "@/i18n/useLocale";
import { SIGNED_IN_HOME, isResetLink } from "@/lib/auth/guestOnly";
import { useCustomer } from "@/store/hooks";

// The browser half of "sign-in pages are for guests only" (rules: src/lib/auth/guestOnly.ts).
// On the real server src/proxy.server.ts already redirected; this covers GitHub Pages and
// client-side navigation (a <Link> to /sign-in/ never reaches the proxy).
//
// It decides once, from the session she arrived with. Signing in on this page (or the reset
// link signing her in) does not trigger it: those flows show their own toast and go on themselves.
//
// Returns `ready`: false while the session is still being read or she is being sent away, so the
// form never flashes for a signed-in customer.

export function useGuestOnly(): { ready: boolean } {
  const router = useRouter();
  const locale = useLocale();
  const { status } = useCustomer();
  // Decided once, when the session is first known: "guest" stays, "member" is sent home.
  const [arrival, setArrival] = useState<"guest" | "member" | null>(null);

  if (arrival === null && router.isReady && status !== "loading") {
    const page = router.pathname.split("/").pop() ?? "";
    const params = new URLSearchParams(router.asPath.split("?")[1]?.split("#")[0] ?? "");
    setArrival(status === "signedIn" && !isResetLink(page, params) ? "member" : "guest");
  }

  useEffect(() => {
    if (arrival === "member") router.replace(localePath(locale, SIGNED_IN_HOME));
  }, [arrival, router, locale]);

  return { ready: arrival === "guest" };
}
