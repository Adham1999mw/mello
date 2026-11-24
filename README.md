# Mello

E-commerce storefront for the Mello clothing brand.

## Stack

- **Next.js** (Pages Router, TypeScript)
- **Material UI** for components + **Tailwind CSS** for styling
  - MUI styles are emitted in the `mui` CSS layer (Emotion cache with `enableCssLayer`, see `src/lib/emotion`), and `src/styles/globals.css` + `_app.tsx` orders layers as `theme, base, mui, components, utilities`, so Tailwind utilities override MUI without `!important`.
  - The MUI theme (`src/theme/theme.ts`) exposes its palette as CSS variables, which Tailwind maps to `bg-primary`, `text-foreground`, etc.
- **Redux Toolkit + RTK Query** (`src/store`) for client state and API caching
- **i18n: Arabic (default, RTL) and English**: pages live under `src/pages/[locale]/` and are pre-rendered for both (`/` and `/ar/` = Arabic, `/en/` = English)
- **Supabase** for database, auth and storage (`src/lib/supabase`), called from the browser
- **Hosting: GitHub Pages** (static export, see [Deploying](#deploying))

## Design rules

**Mobile first, always**, and brand colors/fonts come only from `src/theme/brand.ts`.
See [CLAUDE.md](CLAUDE.md) and [docs/design-guidelines.md](docs/design-guidelines.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Deploying

The site is a static export (`output: "export"` in `next.config.ts`) deployed to GitHub Pages by
`.github/workflows/deploy-pages.yml` on every push to `main`. It is served at
`https://<user>.github.io/mello/`; the workflow passes `/mello` in as `PAGES_BASE_PATH`.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**. For Supabase, add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
**Settings → Secrets and variables → Actions → Variables**.

Because there is no server, these Next.js features are off limits: API routes (`pages/api`),
`getServerSideProps`, middleware, `next/image` optimization and Next's built-in i18n routing.
Use `getStaticProps` / `getStaticPaths` and call Supabase from the browser instead
(row level security protects the data). Test a production build locally with `npm run build`;
the result is in `out/`.

## Translations (ar / en)

- New localized pages go in `src/pages/[locale]/` and add
  `export { getStaticPaths, getStaticProps } from "@/i18n/static";`.
  Build links with `localePath(locale, "/products")` from `@/i18n/static`.
- Strings live in `src/i18n/messages/en.ts` and `ar.ts` (Arabic must match the English keys; TypeScript checks this).
- In a component: `const { t, locale, dir } = useTranslation();` then `t("home.title")`.
- RTL: `<html dir>` is set per locale, MUI flips via `stylis-plugin-rtl` + `theme.direction`, and Tailwind's
  logical utilities (`ms-*`, `pe-*`, `start-*`) and `rtl:` / `ltr:` variants follow it automatically.
  Prefer logical utilities over `ml-*` / `left-*`.

## Project structure

```
src/
  pages/          routes (Pages Router); _app wires MUI + Redux, _document sets lang/dir
  pages/[locale]/ localized pages, pre-rendered for ar and en
  components/     shared components
  i18n/           locale config, messages, useTranslation hook
  lib/emotion/    MUI Emotion cache (CSS layer + RTL)
  lib/supabase/   Supabase clients (browser + server)
  store/          Redux store, typed hooks, RTK Query base API
  styles/         global CSS (Tailwind)
  theme/          brand constants (brand.ts) + MUI theme
```
