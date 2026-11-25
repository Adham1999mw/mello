/**
 * Optional public site address (with the base path, no trailing slash). Share images must be
 * full URLs, so it is put in front of them when set. The GitHub Pages workflow sets it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

/** `path` with the site address in front when it is known ("/og/x.jpg" -> "https://.../og/x.jpg"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Open Graph locale per site locale. */
export const OG_LOCALES = { ar: "ar_EG", en: "en_US" } as const;

/** Default share image (made by scripts/generate-brand-assets.mjs). */
export const DEFAULT_OG_IMAGE = { path: "/og/needle-og.jpg", width: 1200, height: 630 };
