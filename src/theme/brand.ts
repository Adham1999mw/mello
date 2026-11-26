/**
 * Needle brand constants: the single source of truth for colors, fonts,
 * breakpoints and layout sizes. Import from here instead of hard-coding values.
 *
 * - MUI reads these through `src/theme/theme.ts`.
 * - Tailwind reads the same values through the `@theme` block in
 *   `src/styles/globals.css` (keep the two in sync when you change a value here).
 *
 * See docs/design-guidelines.md for how to use them.
 */

export const BRAND = {
  name: "Needle",
  tagline: "Women's wear",
  origin: "Made in Egypt",
  /**
   * Customer contact email, shown on the privacy policy page.
   * TODO: replace the placeholder with the real address (it becomes a mailto link once it has an "@").
   */
  contactEmail: "[contact email]",
} as const;

/** Brand palette, sampled from the logo and the leather label. */
export const COLORS = {
  /** Logo background. Main brand color: hero, header, primary buttons. */
  burgundy: "#3E0614",
  /** Darker burgundy for depth: gradients, footer, hover on burgundy. */
  burgundyDeep: "#2A040D",
  /** Label ink and size tab. Accents on light backgrounds. */
  wine: "#5A0A16",
  /** Logo lettering. Text and buttons on burgundy. */
  champagne: "#EED3B8",
  /** Leather label surface. Cards and highlighted panels. */
  leather: "#EDD5BD",
  /** Light page background. */
  ivory: "#FBF4EC",
  /** Body text on light backgrounds. */
  ink: "#2A040D",
  /** Secondary text on light backgrounds. */
  inkMuted: "#6E4A50",
  white: "#FFFFFF",
  /** Errors and destructive actions (delete, remove). Readable on ivory, white and leather. */
  danger: "#9B1C1C",
} as const;

/**
 * Font families. The CSS variables are set in `src/pages/_app.tsx` by next/font.
 * Latin: Cormorant Garamond (display) + Jost (body/labels).
 * Arabic: Markazi Text (display) + IBM Plex Sans Arabic (body/labels).
 */
export const FONT_VARS = {
  display: "--nd-font-display",
  sans: "--nd-font-sans",
  arDisplay: "--nd-font-ar-display",
  arSans: "--nd-font-ar-sans",
} as const;

export const FONTS = {
  display: `var(${FONT_VARS.display}), "Times New Roman", serif`,
  sans: `var(${FONT_VARS.sans}), "Helvetica Neue", Arial, sans-serif`,
  arDisplay: `var(${FONT_VARS.arDisplay}), "Times New Roman", serif`,
  arSans: `var(${FONT_VARS.arSans}), Tahoma, sans-serif`,
} as const;

/**
 * Breakpoints in px. MOBILE FIRST: base styles are for phones (0 and up);
 * each breakpoint only ADDS changes from that width upwards (min-width).
 * These match Tailwind's defaults (sm/md/lg/xl/2xl) and are passed to MUI.
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** The phone widths every screen must be checked at first. */
export const MOBILE_TEST_WIDTHS = [360, 390, 430] as const;

export const LAYOUT = {
  /** Minimum height/width of anything tappable (buttons, icons, links). */
  minTapTarget: 44,
  /** Side padding on phones, then from `md` up. */
  gutterMobile: 16,
  gutterDesktop: 56,
  /** Max width of page content. */
  contentMaxWidth: 1280,
  /** Base body font size on phones (never below 16px for inputs, to stop iOS zoom). */
  baseFontSize: 16,
  /** Radius for buttons and inputs. The brand look is sharp, so keep it small. */
  radius: 2,
} as const;

export type BrandColor = keyof typeof COLORS;
