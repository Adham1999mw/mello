# Needle design system

All brand values live in one file: [`src/theme/brand.ts`](../theme/brand.ts).
MUI reads it in `src/theme/theme.ts`, and Tailwind gets the same colors through MUI's CSS
variables (`src/styles/globals.css`). **Never write a hex color or a font name in a component.**

## Colors

| Token (`COLORS`) | Hex | Tailwind | MUI | Use |
| ---------------- | --- | -------- | --- | --- |
| `burgundy` | `#3E0614` | `bg-burgundy` | `primary.main` | Hero, dark sections, primary buttons on light pages |
| `burgundyDeep` | `#2A040D` | `burgundy-deep` | `primary.dark` | Gradients, text on champagne buttons |
| `champagne` | `#EED3B8` | `text-champagne`, `bg-champagne` | `secondary.main` | Text and icons on burgundy, primary button on burgundy |
| `wine` | `#5A0A16` | `bg-wine` | `primary.light` | Hover states, accents |
| `leather` | `#EDD5BD` | (image only) | (brand.ts only) | Leather label cream |
| `ivory` | `#FBF4EC` | `bg-ivory` | `background.default` | Light page background |
| `ink` | `#2B1A1D` | `text-ink` | `text.primary` | Body text on light backgrounds |

Softer versions use opacity: `text-champagne/60` for secondary text on burgundy,
`border-champagne/45` for outline borders, `text-ink/65` for muted text on ivory.

## Fonts

| Role | English | Arabic | Tailwind | MUI |
| ---- | ------- | ------ | -------- | --- |
| Headings | Cormorant Garamond | Amiri | `font-display` | `h1`–`h4` |
| Body, buttons, menus | Jost | Cairo | `font-sans` (default) | `body1`, `button`, … |

Each stack holds one Latin and one Arabic font, so the right font is picked for each
letter on its own. The fonts are loaded with `next/font` in `src/pages/_app.tsx`.

Type rules:

- Headings: weight 400, `line-height` 1.12 in English and 1.5 in Arabic.
- Small labels (eyebrows, menus, buttons): uppercase with wide letter spacing (`.22em`–`.32em`)
  in English. In Arabic: no uppercase, no letter spacing, and 2–3px bigger
  (use `rtl:tracking-normal rtl:text-sm`).
- Italic is for one emphasis phrase in a headline (`<em>`), not for body text.

## Layout

| Token (`LAYOUT`) | Value | Tailwind |
| ---------------- | ----- | -------- |
| `radius` | 2px | `rounded-brand` |
| `minTapTarget` | 44px | `min-h-11 min-w-11` / `size-11` |
| `pagePadding.phone` | 20px | `px-5` |
| `pagePadding.desktop` | 56px | `md:px-14` |

- Build the phone layout first, then add desktop styles from `md` (768px).
- Use logical properties (`ms-*`, `ps-*`, `text-start`) and never `left` / `right`, so
  Arabic mirrors automatically.
- Focus ring: 2px outline in the text color, 3px offset.

## Adding a token

1. Add it to `brand.ts`.
2. If MUI needs it, use it in `theme.ts`.
3. If Tailwind needs a color, map it to its `--mui-palette-*` variable in `globals.css`.
