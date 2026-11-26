@AGENTS.md

# Needle storefront: rules for all work

Needle is an Egyptian women's wear brand. This repo is its Next.js storefront
(Pages Router, MUI + Tailwind, English default + Arabic). Read the README for the stack.

## 1. Mobile first, always

Most customers shop on their phones. Every page, component and change is designed
and built for phones first, then enhanced for larger screens.

- Write the base styles for phones. Add tablet/desktop changes only with min-width
  breakpoints: Tailwind `sm:` `md:` `lg:` `xl:`, MUI `theme.breakpoints.up(...)` or
  `sx={{ xs: ..., md: ... }}`. Do not use `max-width` media queries or `breakpoints.down`
  to "fix" mobile after building desktop.
- Check every screen at 360px, 390px and 430px wide first (`MOBILE_TEST_WIDTHS`),
  then at 768px and 1280px. No horizontal scrolling at any width.
- Tap targets are at least 44×44px (`LAYOUT.minTapTarget`). Inputs use at least 16px text.
- Keep content in one column on phones. Main actions are full width and easy to reach.
- Use responsive images (`next/image` with `sizes`) so phones download small files.

## 2. Use the brand constants, never hard-coded values

All brand values live in **`src/theme/brand.ts`**: `COLORS`, `FONTS`, `BREAKPOINTS`,
`LAYOUT`, `BRAND`.

- In MUI: use the theme (`primary`, `secondary`, `text`, `background`) or import from `brand.ts`.
- In Tailwind: use the brand utilities (`bg-burgundy`, `text-champagne`, `bg-leather`,
  `font-display`, ...) defined in `src/styles/globals.css`.
- Do not write hex colors, font names or pixel breakpoints in components.
- If you change a value in `brand.ts`, update the matching `@theme` value in `globals.css`.

## 2a. Use the design system for buttons and text

Buttons and text come from **`@/components/ui`**: `Button`, `IconButton`, `Typography`
(live examples at `/ar/design-system/` and `/en/design-system/`).

- Never style a `<button>`, a button-looking link, a heading or a text style by hand.
  Use `<Button variant tone size>`, `<IconButton label>` and `<Typography variant>`.
- For a `next/link` that is navigation text, use `className={typography("label")}`.
- `className` on these components is for layout only (margin, width, alignment). If no
  variant fits, add one in `src/components/ui/` instead of overriding sizes in place.

## 3. Arabic and RTL

Arabic is right-to-left (English is the default locale). Use logical properties and utilities
(`ms-*`, `pe-*`, `start-*`, `text-start`, `margin-inline-start`) instead of left/right.
Every user-facing string goes in both `src/i18n/messages/en.ts` and `ar.ts`.

## 4. Server (Vercel)

The site runs on Vercel (a real Node server; see README → Deploying).
- Pages that need data per request use `getServerSideProps` and return `locale` in their props.
  For public data, use `createAnonClient()` (`src/lib/supabase/anon.ts`, no cookies) so the page
  can be cached with a `Cache-Control: s-maxage` header. For the signed-in user, use
  `src/lib/supabase/server.ts`.
- Pages with no per-request data stay static: `export { getStaticPaths, getStaticProps } from "@/i18n/static"`.
- `/public` files are referenced by their plain path (`/brand/x.webp`).

Full details: [docs/design-guidelines.md](docs/design-guidelines.md).
Homepage hero build spec: [docs/hero-section.md](docs/hero-section.md).
