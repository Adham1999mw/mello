# Mello

E-commerce storefront for the Mello clothing brand.

## Stack

- **Next.js** (Pages Router, TypeScript)
- **Material UI** for components + **Tailwind CSS** for styling
  - MUI styles are emitted in the `mui` CSS layer (Emotion cache with `enableCssLayer`, see `src/lib/emotion`), and `src/styles/globals.css` + `_app.tsx` orders layers as `theme, base, mui, components, utilities`, so Tailwind utilities override MUI without `!important`.
  - The MUI theme (`src/theme/theme.ts`) exposes its palette as CSS variables, which Tailwind maps to `bg-primary`, `text-foreground`, etc.
- **Redux Toolkit + RTK Query** (`src/store`) for client state and API caching
- **i18n: Arabic (default, RTL) and English**: pages live under `src/pages/[locale]/` and are pre-rendered for both (`/` and `/ar/` = Arabic, `/en/` = English)
- **Supabase** for database, auth and storage (`src/lib/supabase`): from the browser, or on the server in `getServerSideProps` / API routes
  - Catalog (products, color × size variants, filters, pagination): schema in `supabase/migrations`, data layer in `src/lib/catalog`, RTK Query hooks in `src/store/services/products.ts`. Setup guide: [docs/supabase-setup.md](docs/supabase-setup.md)
- **Hosting**: a real Node server (full features) and a GitHub Pages preview (static files); see [Deploying](#deploying)

## Design rules

**Mobile first, always**, and brand colors/fonts come only from `src/theme/brand.ts`.
See [CLAUDE.md](CLAUDE.md) and [docs/design-guidelines.md](docs/design-guidelines.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys (docs/supabase-setup.md)
npm run dev
```

Open http://localhost:3000.

## Deploying

The same code builds two ways (see `next.config.ts`):

| | Real server | GitHub Pages |
| --- | --- | --- |
| Build | `npm run build` then `npm start` (Vercel, a VPS, …) | `.github/workflows/deploy-pages.yml` on every push to `main` |
| Mode | default | `STATIC_EXPORT=true` (static files in `out/`) |
| `getServerSideProps`, Supabase on the server | yes | no: `*.server.tsx` pages are left out |
| API routes (`pages/api`) | yes | skipped |
| `next/image` optimization | yes | no (plain images) |
| URL | `/`, `/ar/`, `/en/` | `https://<user>.github.io/mello/`, `/mello/en/`, … |

**Pages that need the server**: name the file `*.server.tsx`, e.g.
`src/pages/[locale]/orders.server.tsx` is the page `/en/orders/` and can use `getServerSideProps`
with the Supabase server client (`src/lib/supabase/server.ts`). The Pages workflow deletes these
files from its build, so the GitHub Pages preview simply doesn't have them (and the build never fails).
Every other page must work as static files: use `getStaticProps` / `getStaticPaths`, or call
Supabase from the browser.

**GitHub Pages setup** (one time): repo **Settings → Pages → Source: GitHub Actions**. For Supabase, add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
**Settings → Secrets and variables → Actions → Variables**.
On Pages the site lives under `/mello`, so wrap image and CSS asset paths in
`assetPath("/brand/x.webp")` (`src/lib/assetPath.ts`); links from `next/link` get it automatically.

**Server setup**: set the same two Supabase variables on your host, then `npm run build && npm start`.

To try the Pages build locally: `STATIC_EXPORT=true npm run build` (output in `out/`). It fails if a
`*.server.tsx` page exists, because CI removes those first.

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
  lib/catalog/    products API: listProducts (filters + pages), getProductBySlug, getFilterOptions
  store/          Redux store, typed hooks, RTK Query base API + catalog hooks
  styles/         global CSS (Tailwind)
  theme/          brand constants (brand.ts) + MUI theme
supabase/
  migrations/     SQL for the database (tables, RLS, search_products)
  seed.sql        sample products for testing
```
