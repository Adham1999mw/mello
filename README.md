# Mello

E-commerce storefront for the Mello clothing brand.

## Stack

- **Next.js** (Pages Router, TypeScript)
- **Material UI** for components + **Tailwind CSS** for styling
  - MUI styles are emitted in the `mui` CSS layer (Emotion cache with `enableCssLayer`, see `src/lib/emotion`), and `src/styles/globals.css` + `_app.tsx` orders layers as `theme, base, mui, components, utilities`, so Tailwind utilities override MUI without `!important`.
  - The MUI theme (`src/theme/theme.ts`) exposes its palette as CSS variables, which Tailwind maps to `bg-primary`, `text-foreground`, etc.
- **Redux Toolkit + RTK Query** (`src/store`) for client state and API caching
- **i18n: English (default) and Arabic (RTL)**: pages live under `src/pages/[locale]/` and are pre-rendered for both (`/` and `/en/` = English, `/ar/` = Arabic)
- **Supabase** for database, auth and storage (`src/lib/supabase`): from the browser, or on the server in `getServerSideProps` / API routes
  - Catalog (products, color × size variants, filters, pagination): schema in `supabase/migrations`, data layer in `src/lib/catalog`, RTK Query hooks in `src/store/services/products.ts`. Setup guide: [docs/supabase-setup.md](docs/supabase-setup.md)
  - Admin dashboard at `/ar/admin/` (`src/pages/[locale]/admin`, `src/components/admin`, `src/lib/admin`): log in with Supabase Auth; RLS allows writes only for users in `public.admins`
  - Customer accounts (email + password, Google, forgot / reset password): tables `profiles` + `addresses` in `supabase/migrations`, browser helpers in `src/lib/auth`. Setup: [docs/customer-accounts.md](docs/customer-accounts.md)
- **Hosting**: Vercel; see [Deploying](#deploying)

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

The site is hosted on **Vercel**. Every push to `main` deploys; every pull request gets a preview link.

**One-time setup**: import the GitHub repo in Vercel (Framework: Next.js; the install command comes
from `vercel.json`), then add these Environment Variables:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | the Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon / publishable key (never the service_role / secret key) |
| `NEXT_PUBLIC_SITE_URL` | the site address, e.g. `https://<project>.vercel.app` (share images, SEO) |

Also add the Vercel address to Supabase **Authentication → URL Configuration → Redirect URLs**
(`https://<project>.vercel.app/**`) and to Google's **Authorized JavaScript origins**
(see docs/customer-accounts.md).

**How it runs**
- Static pages (home, sign-in, account, admin, …) are pre-rendered once per locale with
  `getStaticPaths` / `getStaticProps` from `@/i18n/static`.
- Pages that need data per request use `getServerSideProps`, e.g. the product page
  `src/pages/[locale]/product/[slug].tsx`. Public data uses `createAnonClient()`
  (`src/lib/supabase/anon.ts`, no cookies) so the CDN can cache the page (`s-maxage`).
  The signed-in user's data uses `src/lib/supabase/server.ts`.
- The browser calls Supabase through our proxy `/supabase/...` (`rewrites` in `next.config.ts`).
- `src/proxy.ts` sends signed-in visitors away from the sign-in pages before they load.

**Locally**: `npm run build && npm start` runs the same production build.

## SEO, icons and share images

- **Every page renders `<Seo />`** (`src/components/seo/Seo.tsx`): title, description,
  Open Graph, Twitter card and optional JSON-LD.
  E.g. `<Seo title={product.name} description={...} image={{ url: photoUrl }} type="product" />`,
  or `<Seo noindex />` for private pages. Default texts are under `seo` in the messages files.
- **Site-wide tags** (favicons, manifest, theme color) are in `src/pages/_app.tsx`.
- **Icons + share image** are plain files: `public/favicon.ico`, `public/icons/`,
  `public/og/needle-og.jpg` (1200×630) and `public/site.webmanifest`.
- **`NEXT_PUBLIC_SITE_URL`** (optional) is put in front of the share image URL, which should be a
  full address. Set it in Vercel's Environment Variables.

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
