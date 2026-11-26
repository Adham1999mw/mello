// Sign-in pages are for guests only: a signed-in customer who opens one is sent to the home page.
//
// Two layers, because the same code runs on a real server and as static files on GitHub Pages:
//   1. src/proxy.server.ts      on the server, redirects before the page loads (no flash).
//   2. useGuestOnly()           in the browser (components/auth), for GitHub Pages and for
//                               client-side navigation, where the proxy does not run.
//
// The one exception: /reset-password/ opened from the email link (?token_hash= or ?code=).
// That link is how she proves who she is, so it must work even if she is already signed in.

/** Sign-in pages, without the locale: /ar/sign-in/ → "sign-in". */
export const GUEST_ONLY_PAGES = ["sign-in", "forgot-password", "reset-password"] as const;

/** Where a signed-in customer goes instead (same as after signing in). */
export const SIGNED_IN_HOME = "/";

/** Query parameters of the reset-password email link. */
const RESET_LINK_PARAMS = ["token_hash", "code", "error"];

/** True when this is /reset-password/ opened from the email link (let it through). */
export function isResetLink(page: string, params: URLSearchParams): boolean {
  return page === "reset-password" && RESET_LINK_PARAMS.some((name) => params.has(name));
}
