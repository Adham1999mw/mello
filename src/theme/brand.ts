// Needle design tokens: the single source for colors, fonts and layout values.
// MUI reads them in theme.ts, and Tailwind gets them through MUI's CSS variables
// (see globals.css). Change a value here and both systems update.

export const COLORS = {
  burgundy: "#3E0614", // main brand color: hero, dark sections, primary buttons on light pages
  burgundyDeep: "#2A040D", // deeper shade: gradients, text on champagne buttons
  champagne: "#EED3B8", // logo cream: text and icons on burgundy, primary button fill on burgundy
  wine: "#5A0A16", // lighter burgundy: hover states, accents
  leather: "#EDD5BD", // leather-label cream
  ivory: "#FBF4EC", // light page background
  ink: "#2B1A1D", // body text on light backgrounds
} as const;

// Each stack holds one Latin font and one Arabic font. The browser picks the Arabic
// font for Arabic letters on its own, so the same stack works in both languages.
// The `--font-*` variables are set by next/font in _app.tsx.
export const FONTS = {
  display: "var(--font-cormorant), var(--font-amiri), serif", // headings
  sans: "var(--font-jost), var(--font-cairo), sans-serif", // body, buttons, menus
} as const;

export const LAYOUT = {
  radius: 2, // px, buttons and cards
  minTapTarget: 44, // px, smallest size for anything you can tap
  pagePadding: { phone: 20, desktop: 56 }, // px, side padding of sections
} as const;
