# Needle design guidelines

These rules apply to every page and component in the storefront. The values live in
[`src/theme/brand.ts`](../src/theme/brand.ts); this document explains how to use them.

## Mobile first

We design and build for phones first. Larger screens are a progressive enhancement.

### How to write styles

The base (unprefixed) style is the phone style. Breakpoints only add changes from a
width **upwards**.

```tsx
// Tailwind: one column on phones, two from md (768px) up
<div className="grid gap-6 md:grid-cols-2">

// MUI sx: phone value first, then larger screens
<Typography sx={{ fontSize: { xs: 30, md: 52 } }} />

// MUI styled / theme
[theme.breakpoints.up("md")]: { flexDirection: "row" }
```

Avoid:

```tsx
// Desktop first, then patched for mobile: don't do this
<div className="grid grid-cols-2 max-md:grid-cols-1">
[theme.breakpoints.down("md")]: { ... }
```

### Breakpoints

| Name | Min width | Typical device          |
| ---- | --------- | ----------------------- |
| base | 0         | Phones (design here first) |
| sm   | 640px     | Large phones, landscape |
| md   | 768px     | Tablets                 |
| lg   | 1024px    | Small laptops           |
| xl   | 1280px    | Desktops                |
| 2xl  | 1536px    | Large desktops          |

The same values are used by Tailwind and MUI.

### Checklist before a change is done

- [ ] Looks right at **360px, 390px and 430px** wide, then at 768px and 1280px.
- [ ] No horizontal scroll at any width.
- [ ] Every button, link and icon is at least **44×44px** to tap.
- [ ] Inputs use at least **16px** text (smaller text makes iOS zoom in).
- [ ] The main action on the screen is easy to reach with a thumb (full width on phones).
- [ ] Images use `next/image` with a `sizes` value, so phones download small files.
- [ ] Works in Arabic (RTL) and English.

## Colors

| Token          | Hex       | Tailwind          | Use                                         |
| -------------- | --------- | ----------------- | ------------------------------------------- |
| `burgundy`     | `#3E0614` | `bg-burgundy`     | Main brand color: hero, header, primary buttons |
| `burgundyDeep` | `#2A040D` | `bg-burgundy-deep`| Depth: gradients, footer, hover             |
| `wine`         | `#5A0A16` | `text-wine`       | Accents on light backgrounds (label ink)    |
| `champagne`    | `#EED3B8` | `text-champagne`  | Logo lettering, text and buttons on burgundy |
| `leather`      | `#EDD5BD` | `bg-leather`      | Label surface: cards, highlighted panels    |
| `ivory`        | `#FBF4EC` | `bg-ivory`        | Light page background                       |
| `ink`          | `#2A040D` | `text-ink`        | Body text on light backgrounds              |
| `inkMuted`     | `#6E4A50` | `text-ink-muted`  | Secondary text on light backgrounds         |
| `danger`       | `#9B1C1C` | `text-danger`     | Errors and delete actions                   |

Pairings: champagne on burgundy, burgundy or ink on ivory/leather. Do not put
champagne text on ivory or leather (too little contrast).

## Typography

| Role            | Latin               | Arabic | Tailwind       |
| --------------- | ------------------- | ------ | -------------- |
| Display (headings) | Cormorant Garamond | Markazi Text  | `font-display` |
| Body, labels, buttons | Jost           | IBM Plex Sans Arabic  | `font-sans` (default) |

- Headings use the display face at weight 400 (Arabic: Markazi Text at 500, a size up). Italic is for
  one or two emphasized words in English. Markazi has no italic, so Arabic emphasis uses color (`text-leather`).
- Small labels and buttons in English are uppercase with wide letter spacing
  (about `0.2em`). Arabic text is never uppercased or letter-spaced.
- Body text is 16px on phones.

### Type scale (`Typography`)

All text styles live in `src/components/ui/Typography.tsx`. Use `<Typography variant="...">`,
or `typography("...")` for a class string on an element that can't be a Typography.

| Variant | Use | Default element |
| ------- | --- | --------------- |
| `display` | Hero headline | `h1` |
| `h1` | Page and section titles | `h1` |
| `h2` | Sub-section titles | `h2` |
| `h3` | Featured item name (lookbook) | `h3` |
| `h4` | Product card name | `h4` |
| `subtitle` | Small sans headings in forms and lists | `h3` |
| `eyebrow` | Small uppercase line above a title | `p` |
| `label` | Nav links, small text actions | `span` |
| `button` | Button text (Button uses it) | `span` |
| `note` | Tiniest uppercase text: service notes, tab bar | `span` |
| `body` / `bodySm` / `caption` | Body, secondary, meta text | `p` / `p` / `span` |
| `price` / `priceSm` | Featured price / grid price | `p` |

Props: `as` (element), `color` (`inherit` `ink` `muted` `burgundy` `champagne` `danger`),
`italic` (English only; Arabic stays upright). The Arabic adjustments (no uppercase or
letter spacing, a size up, Markazi Text 500) are built into every variant.

## Buttons

All buttons come from `src/components/ui`. Live examples: `/ar/design-system/`, `/en/design-system/`.

**`Button`**: `variant` × `tone`, plus `size` and `fullWidth`.

| `variant` | Use |
| --------- | --- |
| `solid` (default) | The main action on a screen. One per screen. |
| `outline` | Second action next to a solid one |
| `text` | Quiet actions: Cancel, Remove, Sign out |
| `link` | Underlined "View all" style links |

| `tone` | Use |
| ------ | --- |
| `burgundy` (default) | On ivory, white and leather |
| `champagne` | On burgundy (hero, admin top bar) |
| `ink` | Neutral, on light backgrounds |
| `danger` | Delete and other actions that can't be undone |

- `size`: `sm` 44px, `md` 48px (default), `lg` 48px phone / 52px desktop (hero).
- `fullWidth="mobile"`: full width on phones, natural width from `md` up (the usual main action).
- `href` renders a `next/link`; without it, a `<button type="button">`. Also `disabled`, `startIcon`, `endIcon`.

**`IconButton`**: a 44×44px icon-only button. `label` is required (screen readers).
`variant="plain"` (default) or `"outline"` (round, e.g. carousel arrows); `tone="current"`
(default, takes the parent's color) or any button tone.

```tsx
import { Button, IconButton, Typography } from "@/components/ui";

<Typography variant="h1" as="h2" italic>{t("home.products.title")}</Typography>
<Button href={localePath(locale, "/shop")} fullWidth="mobile">{t("home.hero.shop")}</Button>
<Button variant="text" tone="danger" onClick={remove}>{t("admin.form.remove")}</Button>
<IconButton label={t("nav.search")}><SearchIcon /></IconButton>
```

Small custom controls (color dots, photo bullets, the lookbook progress bar) are not buttons in
this sense and keep their own styles, but still need a 44px tap area.

## Shape and spacing

- Corners are nearly square (`LAYOUT.radius`, 2px). The brand is tailored, not bubbly.
- Side padding: 16px on phones, 56px from `md` up.
- Content max width: 1280px.

## Brand assets

The logo, monogram and leather label artwork are in the project files under `logo/`.
The burgundy logo with cream lettering is the primary version on dark backgrounds.
