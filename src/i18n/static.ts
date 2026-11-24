import type { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { locales, type Locale } from "./config";
import { useLocale } from "./useLocale";

// The site is a static export (GitHub Pages), so Next's built-in i18n routing is not
// available. Instead every localized page lives under `src/pages/[locale]/` and is
// pre-rendered once per locale with these helpers:
//
//   export { getStaticPaths, getStaticProps } from "@/i18n/static";
//
// `/` also serves the Arabic home page (see src/pages/index.tsx).
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: locales.map((locale) => ({ params: { locale } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ locale: Locale }, { locale: Locale }> = async ({
  params,
}) => ({
  props: { locale: params!.locale },
});

/** `href` (e.g. "/shop?sort=new") in `locale`, e.g. "/en/shop/?sort=new". */
export function localePath(locale: Locale, href = "/"): string {
  const [, path = "", rest = ""] = href.match(/^([^?#]*)(.*)$/) ?? [];
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `/${locale}/${clean ? `${clean}/` : ""}${rest}`;
}

/** Strips the locale segment and query from a router path: "/en/shop/?a=1" -> "/shop". */
export function stripLocale(asPath: string): string {
  const [pathname] = asPath.split(/[?#]/);
  const parts = pathname.split("/").filter(Boolean);
  if (locales.includes(parts[0] as Locale)) parts.shift();
  return `/${parts.join("/")}`;
}

/** Returns a function that turns "/shop" into the current locale's "/ar/shop/". */
export function useLocalePath() {
  const locale = useLocale();
  return useCallback((href: string) => localePath(locale, href), [locale]);
}

/** The current page without its locale, e.g. "/" for the home page, "/shop" for /en/shop/. */
export function useCurrentPath() {
  return stripLocale(useRouter().asPath);
}

/**
 * Prefixes a file in `public/` with the base path (e.g. "/mello" on GitHub Pages).
 * Needed for plain URLs (`next/image` with `unoptimized`, CSS `url()`); next/link adds it itself.
 */
export function asset(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
