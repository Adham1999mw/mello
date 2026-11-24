import type { GetStaticPaths, GetStaticProps } from "next";
import { locales, type Locale } from "./config";

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

/** Path of `path` (e.g. "/products?sort=new") in `locale`, e.g. "/en/products/?sort=new". */
export function localePath(locale: Locale, path = "/"): string {
  const [pathname, query] = path.split("?");
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  const localized = clean ? `/${locale}/${clean}/` : `/${locale}/`;
  return query ? `${localized}?${query}` : localized;
}

/** True on the home page: `/` (Arabic) or `/ar/`, `/en/` (the `[locale]` index page). */
export function isHomePage(pathname: string): boolean {
  return pathname === "/" || pathname === "/[locale]";
}

/** Strips the leading locale segment from a router path: "/en/products/" -> "/products/". */
export function stripLocale(asPath: string): string {
  const [pathname] = asPath.split(/[?#]/);
  const parts = pathname.split("/").filter(Boolean);
  if (locales.includes(parts[0] as Locale)) parts.shift();
  return `/${parts.join("/")}`;
}
