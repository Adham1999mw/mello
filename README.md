# Mello

E-commerce storefront for the Mello clothing brand.

## Stack

- **Next.js** (App Router, TypeScript)
- **Material UI** for components + **Tailwind CSS** for styling
  - MUI styles are emitted in the `mui` CSS layer (`AppRouterCacheProvider` with `enableCssLayer`), and `src/app/globals.css` orders layers as `theme, base, mui, components, utilities`, so Tailwind utilities override MUI without `!important`.
  - The MUI theme (`src/theme/theme.ts`) exposes its palette as CSS variables, which Tailwind maps to `bg-primary`, `text-foreground`, etc.
- **Redux Toolkit + RTK Query** (`src/store`) for client state and API caching
- **Supabase** for database, auth and storage (`src/lib/supabase`)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Project structure

```
src/
  app/            routes (App Router)
  components/     shared components (Providers wires MUI + Redux)
  lib/supabase/   Supabase clients (browser + server)
  store/          Redux store, typed hooks, RTK Query base API
  theme/          MUI theme
```
