# Homepage hero: build spec (version A)

Approved design: **version A**. Preview: https://claude.ai/artifact/3CYzSHyztviKVtWJQDnT5L
(open it and switch between English and العربية to see both directions).

Follow [CLAUDE.md](../CLAUDE.md) and [design-guidelines.md](design-guidelines.md):
**build the phone layout first**, then add the desktop layout from `md` (768px) up.
All colors, fonts and sizes come from `src/theme/brand.ts` and the Tailwind brand utilities.

---

## 1. What it is

A full-width burgundy band at the top of the homepage:

1. **Top bar**: ND monogram, then search, bag and menu icons (desktop adds text links).
2. **Brand block**: the cream NEEDLE logo (monogram + wordmark + "Women's wear").
3. **Copy**: small eyebrow, serif headline with one italic phrase, two buttons.
4. **Leather label**: the cream "Made in Egypt" label with the size tab, hanging from a
   dashed thread. It keeps swinging gently from side to side.
5. **Stitched seam** (dashed line) and a row of three service notes at the bottom.

## 2. Files

| What | Where |
| ---- | ----- |
| Component | `src/components/home/HeroSection.tsx` (new) |
| Used in | `src/pages/index.tsx` (replace the current placeholder `<main>`) |
| Logo (cream, transparent) | `public/brand/needle-logo-cream.webp` (807×606) |
| Monogram (cream, transparent) | `public/brand/needle-monogram-cream.webp` (596×389) |
| Leather label with size tab | `public/brand/needle-label.webp` (900×635) |
| English strings | `src/i18n/messages/en.ts` → `home.hero` |
| Arabic strings | `src/i18n/messages/ar.ts` → `home.hero` |

Use `next/image` for all three images, with `sizes` set (see section 5) and `priority` on
the logo, because it is above the fold.

## 3. Tokens used

| Use | Token (`brand.ts`) | Tailwind |
| --- | ------------------ | -------- |
| Hero background | `COLORS.burgundy` `#3E0614` | `bg-burgundy` |
| Gradient depth (bottom) | `COLORS.burgundyDeep` `#2A040D` | `burgundy-deep` |
| Text, icons, primary button fill | `COLORS.champagne` `#EED3B8` | `text-champagne`, `bg-champagne` |
| Secondary text, eyebrow, footer notes | champagne at 62% opacity | `text-champagne/60` |
| Outline button border | champagne at 45% opacity | `border-champagne/45` |
| Primary button text | `COLORS.burgundyDeep` | `text-burgundy-deep` |
| Headline font | `FONTS.display` (Cormorant Garamond / Amiri) | `font-display` |
| Everything else | `FONTS.sans` (Jost / Cairo) | `font-sans` |
| Button radius | `LAYOUT.radius` (2px) | `rounded-brand` |
| Min tap size | `LAYOUT.minTapTarget` (44px) | `min-h-11 min-w-11` |

Background (both layouts):

```css
background:
  radial-gradient(120% 70% at 50% 18%, rgb(110 18 38 / .55), transparent 60%),
  radial-gradient(90% 60% at 50% 100%, #2A040D, transparent 70%),
  #3E0614;
```

Optional leather grain on top: a 3×3px dot pattern, `rgb(0 0 0 / .5)` dots, at 18% opacity,
`pointer-events: none`.

## 4. Layout

### 4.1 Phone (base styles, under 768px)

One centered column. All text is centered.

```
┌──────────────────────────────┐
│ [ND]               🔍  👜  ☰ │  top bar: padding 48px 20px 0 (below the status bar)
│                              │
│          ND  (logo)          │  logo: width min(78%, 290px)
│        N E E D L E           │
│      — WOMEN'S WEAR —        │
│                              │  gap 18px
│         NEW SEASON           │  eyebrow
│      Pieces made to          │  headline 30px, max 15ch
│   *fit you*, stitch by       │
│          stitch              │
│ ┌──────────────────────────┐ │  primary button, full width (max 320px), 48px tall
│ │   SHOP THE COLLECTION    │ │
│ └──────────────────────────┘ │  gap 10px
│ ┌──────────────────────────┐ │  outline button, same size
│ │      NEW ARRIVALS        │ │
│ └──────────────────────────┘ │
│              ┆               │  thread: dashed, 58px tall
│       ┌──────────────┐       │  label: width min(84%, 300px), rotated -3°
│       │  ND  leather │       │
│       └──────[L]─────┘       │
│                              │  padding-bottom 40px
│ - - - - - - - - - - - - - - -│  seam: 1.5px dashed champagne/40, margin 0 20px 22px
│ FREE DELIVERY · EASY RETURNS │  footer notes: wrap and center, gap 8px 18px
│      · CASH ON DELIVERY      │
└──────────────────────────────┘
```

- Hero body: `display: grid; justify-items: center; gap: 26px; padding: 24px 20px 40px`.
- Brand block (logo + copy): `grid; justify-items: center; gap: 18px`.
- Copy block: `grid; justify-items: center; gap: 14px`.
- Text links in the top bar are **hidden** on phones.
- Monogram in the top bar: 38px wide.

### 4.2 Desktop (`md`, 768px and up)

Two columns: brand + copy on the start side, label on the end side. Text aligns to the start.

```
┌───────────────────────────────────────────────────────────────────────┐
│ [ND]         NEW IN    SHOP    OUR STORY                    🔍  👜  ☰ │ padding 30px 56px 0
│                                                                       │
│   ND (logo, 440px)                         ┆  thread 76px            │
│   N E E D L E                     ┌──────────────────┐                │
│   — WOMEN'S WEAR —                │   ND   leather   │  label 500px   │
│                                   └───────[L]────────┘  rotated -3°   │
│   NEW SEASON                                                          │
│   Pieces made to *fit you*,                                           │
│   stitch by stitch      (52px)                                        │
│   [SHOP THE COLLECTION] [NEW ARRIVALS]                                │
│                                                                       │
│ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - │ seam, margin 0 56px 22px
│ FREE DELIVERY IN CAIRO     EASY RETURNS     CASH ON DELIVERY          │ start-aligned, gap 34px
└───────────────────────────────────────────────────────────────────────┘
```

- Hero body: `grid-template-columns: 1.05fr .95fr; align-items: center; gap: 40px;
  padding: 30px 56px 52px; min-height: 560px`.
- Logo: 440px wide, `margin-inline-start: -14px` (lines the letters up with the text edge).
- Headline: 52px (Arabic 48px), max 15ch.
- Buttons: side by side, 52px tall, padding 0 32px.
- Eyebrow: 12px.
- Label: 500px wide, centered in its column, `padding-top: 70px`, thread 76px tall.
- Top bar monogram: 46px. Show the text links: 12px, `letter-spacing: .22em`, uppercase, gap 34px.

In Arabic (`dir="rtl"`) the columns mirror automatically if you use grid and logical
properties (`ms-*`, `ps-*`, `text-start`). Do not use `left` / `right`.

## 5. Elements in detail

### Images

```tsx
<Image src="/brand/needle-logo-cream.webp" alt={t("home.hero.logoAlt")}
  width={807} height={606} priority
  sizes="(min-width: 768px) 440px, min(78vw, 290px)" />

<Image src="/brand/needle-label.webp" alt={t("home.hero.labelAlt")}
  width={900} height={635}
  sizes="(min-width: 768px) 500px, min(84vw, 300px)" />

<Image src="/brand/needle-monogram-cream.webp" alt="Needle"
  width={596} height={389} sizes="46px" />
```

### Eyebrow

Jost 400, 11px (12px desktop), `letter-spacing: .32em`, uppercase, champagne/62%.

### Headline

`<h1>`, Cormorant Garamond 400, 30px phone / 52px desktop, `line-height: 1.12`,
`text-wrap: balance`. The phrase "fit you" is `<em>` (italic). Arabic: Amiri,
`line-height: 1.5`, 30px phone / 48px desktop.

### Buttons

| | Primary | Outline |
| - | ------- | ------- |
| Fill | champagne | transparent |
| Text | burgundy-deep | champagne |
| Border | 1px champagne | 1px champagne/45 |
| Height | 48px phone, 52px desktop | same |
| Text style | Jost 500, 12px, `letter-spacing: .24em`, uppercase | same |
| Radius | 2px | 2px |

Use MUI `Button` (`variant="contained" color="secondary"` and `variant="outlined"`) or a
plain link styled with Tailwind; both are fine as long as the tokens are used. Visible focus
ring: 2px champagne outline, 3px offset. In Arabic: Cairo, 15px, no letter-spacing, no uppercase.

### Thread and label

- Thread: a 1.4px dashed vertical line (`stroke-dasharray: 5 5`, champagne) from the top of
  the label wrapper down to the label. Phone 58px tall, desktop 76px.
- Label: `rotate: -3deg`, `transform-origin` at the top of the thread
  (`50% -54px` phone, `50% -70px` desktop), shadow `drop-shadow(0 18px 22px rgb(0 0 0 / .45))`.
- **Swing** (1.6s each way, `ease-in-out`, `infinite alternate`):

```css
@keyframes sway {
  from { rotate: 4deg; }
  to   { rotate: -10deg; }
}
@media (prefers-reduced-motion: reduce) { .label { animation: none; } }
```

### Seam and footer notes

- Seam: `border-top: 1.5px dashed` champagne/40.
- Notes: Jost 400, 10px, `letter-spacing: .2em`, uppercase, champagne/62%, `white-space: nowrap`
  on each item, `flex-wrap: wrap`. Arabic: Cairo 14px, no letter-spacing.

### Top bar icons

Search, bag and menu, 22px line icons (stroke 1.3, champagne), each inside a **44×44px**
button with an `aria-label`. Gap 18px.

## 6. Text (add to i18n)

```ts
// en.ts → home.hero
hero: {
  eyebrow: "New season",
  headlineStart: "Pieces made to ",
  headlineEm: "fit you",
  headlineEnd: ", stitch by stitch",
  shop: "Shop the collection",
  newArrivals: "New arrivals",
  navNew: "New in",
  navShop: "Shop",
  navStory: "Our story",
  noteDelivery: "Free delivery in Cairo",
  noteReturns: "Easy returns",
  noteCod: "Cash on delivery",
  logoAlt: "Needle, women's wear",
  labelAlt: "Needle leather label, Made in Egypt",
  search: "Search",
  bag: "Bag",
  menu: "Menu",
},

// ar.ts → home.hero
hero: {
  eyebrow: "الموسم الجديد",
  headlineStart: "قطع مصنوعة ",
  headlineEm: "لتناسبكِ",
  headlineEnd: "، غُرزة بغُرزة",
  shop: "تسوّقي المجموعة",
  newArrivals: "وصل حديثاً",
  navNew: "الجديد",
  navShop: "تسوّقي",
  navStory: "قصتنا",
  noteDelivery: "توصيل مجاني داخل القاهرة",
  noteReturns: "استرجاع سهل",
  noteCod: "الدفع عند الاستلام",
  logoAlt: "نيدل، أزياء نسائية",
  labelAlt: "بطاقة نيدل الجلدية، صُنع في مصر",
  search: "بحث",
  bag: "الحقيبة",
  menu: "القائمة",
},
```

The copy is a placeholder until the final wording is confirmed. Button links: "Shop the
collection" → `/shop`, "New arrivals" → `/shop?sort=new` (change when those pages exist).

## 7. Skeleton (Tailwind, mobile-first)

A starting point. Unprefixed classes are the phone layout; `md:` adds the desktop layout.

```tsx
<section className="hero relative isolate overflow-hidden bg-burgundy text-champagne">
  <nav className="flex items-center justify-between px-5 pt-12 md:px-14 md:pt-8">
    <Image /* monogram */ className="w-[38px] md:w-[46px]" />
    <div className="hidden gap-8 md:flex">{/* text links */}</div>
    <div className="flex gap-1">{/* 44×44 icon buttons */}</div>
  </nav>

  <div className="grid justify-items-center gap-6 px-5 pb-10 pt-6 text-center
                  md:min-h-[560px] md:grid-cols-[1.05fr_.95fr] md:items-center
                  md:justify-items-start md:gap-10 md:px-14 md:pb-13 md:pt-8 md:text-start">
    <div className="grid justify-items-center gap-[18px] md:justify-items-start md:gap-[30px]">
      <Image /* logo */ className="w-[min(78%,290px)] md:-ms-3.5 md:w-[440px]" />
      <div className="grid justify-items-center gap-3.5 md:justify-items-start">
        <span className="eyebrow">…</span>
        <h1 className="font-display text-[30px] leading-[1.12] md:text-[52px]">…</h1>
        <div className="grid w-full max-w-80 gap-2.5 md:flex md:w-auto md:max-w-none">…</div>
      </div>
    </div>

    <div className="relative w-[min(84%,300px)] pt-[54px] md:w-[500px] md:justify-self-center md:pt-[70px]">
      {/* dashed thread + label image with the sway animation */}
    </div>
  </div>

  <div className="mx-5 mb-[22px] border-t-[1.5px] border-dashed border-champagne/40 md:mx-14" />
  <ul className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 px-5 pb-6
                 md:justify-start md:gap-[34px] md:px-14 md:pb-7">…</ul>
</section>
```

## 8. Done when

- [ ] Matches the preview at **360, 390 and 430px** wide first, then at 768px and 1280px.
- [ ] No horizontal scroll at any width.
- [ ] Every icon and button is at least 44×44px to tap.
- [ ] Arabic (`/`) mirrors correctly and uses Amiri / Cairo; English (`/en`) uses Cormorant / Jost.
- [ ] No hex colors or font names in the component; only brand tokens.
- [ ] The label keeps swinging, and stays still with reduced motion turned on.
- [ ] Logo has `priority`; all images have `sizes`.
- [ ] `npm run lint` and `npm run build` pass.
