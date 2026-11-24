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

Pairings: champagne on burgundy, burgundy or ink on ivory/leather. Do not put
champagne text on ivory or leather (too little contrast).

## Typography

| Role            | Latin               | Arabic | Tailwind       |
| --------------- | ------------------- | ------ | -------------- |
| Display (headings) | Cormorant Garamond | Noto Kufi Arabic (ExtraLight 200) | `font-display` |
| Body, labels, buttons | Jost           | Alexandria | `font-sans` (default) |

- Headings use the display face at weight 400. Italic is for one or two emphasized words.
- Small labels and buttons in English are uppercase with wide letter spacing
  (about `0.2em`). Arabic text is never uppercased or letter-spaced.
- Body text is 16px on phones.

## Shape and spacing

- Corners are nearly square (`LAYOUT.radius`, 2px). The brand is tailored, not bubbly.
- Side padding: 16px on phones, 56px from `md` up.
- Content max width: 1280px.

## Brand assets

The logo, monogram and leather label artwork are in the project files under `logo/`.
The burgundy logo with cream lettering is the primary version on dark backgrounds.
