# Mello

E-commerce storefront for the Mello clothing brand.

## Stack

- **Next.js** (Pages Router, TypeScript)
- **Material UI** for components + **Tailwind CSS** for styling
  - MUI styles are emitted in the `mui` CSS layer (Emotion cache with `enableCssLayer`, see `src/lib/emotion`), and `src/styles/globals.css` + `_app.tsx` orders layers as `theme, base, mui, components, utilities`, so Tailwind utilities override MUI without `!important`.
  - The MUI theme (`src/theme/theme.ts`) exposes its palette as CSS variables, which Tailwind maps to `bg-primary`, `text-foreground`, etc.
- **Redux Toolkit + RTK Query** (`src/store`) for client state and API caching
- **i18n: Arabic (default, RTL) and English** via Next's built-in i18n routing (`/` = Arabic, `/en` = English)
- **Supabase** for database, auth and storage (`src/lib/supabase`)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Translations (ar / en)

- Strings live in `src/i18n/messages/en.ts` and `ar.ts` (Arabic must match the English keys; TypeScript checks this).
- In a component: `const { t, locale, dir } = useTranslation();` then `t("home.title")`.
- RTL: `<html dir>` is set per locale, MUI flips via `stylis-plugin-rtl` + `theme.direction`, and Tailwind's
  logical utilities (`ms-*`, `pe-*`, `start-*`) and `rtl:` / `ltr:` variants follow it automatically.
  Prefer logical utilities over `ml-*` / `left-*`.

## Project structure

```
src/
  pages/          routes (Pages Router); _app wires MUI + Redux, _document sets lang/dir
  pages/api/      API routes (store logic will live here)
  components/     shared components
  i18n/           locale config, messages, useTranslation hook
  lib/emotion/    MUI Emotion cache (CSS layer + RTL)
  lib/supabase/   Supabase clients (browser + server)
  store/          Redux store, typed hooks, RTK Query base API
  styles/         global CSS (Tailwind)
  theme/          MUI theme
```
