import type { ElementType, HTMLAttributes } from "react";
import { cn } from "./cn";

// Needle type scale: the only place text sizes, fonts and letter spacing are decided.
// Mobile first: the base class is the phone size; `md:` makes it bigger from 768px up.
// Arabic (`rtl:`) has no capitals or italic, so it drops uppercase and letter spacing,
// is set a size larger, and uses Markazi Text at 500 with a taller line height for headings.
// See docs/design-guidelines.md → Typography.
const VARIANTS = {
  /** Hero headline. An `<em>` inside is italic in English and upright in Arabic (color it per section). */
  display:
    "font-display text-[30px] leading-[1.12] text-balance md:text-[52px] " +
    "rtl:text-[36px] rtl:leading-[1.3] rtl:font-medium md:rtl:text-[56px] rtl:[&_em]:not-italic",
  /** Page and section titles ("New arrivals", admin page titles). */
  h1: "font-display text-[30px] leading-[1.12] md:text-[44px] rtl:leading-[1.3] rtl:font-medium",
  /** Sub-section titles (admin form sections). */
  h2: "font-display text-2xl leading-tight md:text-[28px] rtl:leading-[1.4] rtl:font-medium",
  /** Featured item name (lookbook look). */
  h3: "font-display text-[22px] leading-tight md:text-[26px] rtl:font-medium",
  /** Product card name. */
  h4: "font-display text-[17px] leading-[1.25] font-medium md:text-xl",
  /** Bold sans line for small headings inside forms and lists. */
  subtitle: "text-base font-medium",
  /** Small uppercase line above a title ("New season"). */
  eyebrow:
    "text-[11px] leading-none tracking-[0.32em] uppercase md:text-xs rtl:text-[13px] rtl:tracking-normal",
  /** Navigation links and small text actions. */
  label: "text-xs leading-none tracking-[0.22em] uppercase rtl:text-sm rtl:tracking-normal rtl:normal-case",
  /** Button text (used by Button; use it only for things that look like buttons). */
  button:
    "text-xs leading-none font-medium tracking-[0.24em] uppercase rtl:text-sm rtl:tracking-normal rtl:normal-case",
  /** The tiniest uppercase text: service notes, tab bar labels. */
  note: "text-[10px] leading-[1.4] tracking-[0.2em] uppercase rtl:text-[13px] rtl:leading-none rtl:tracking-normal",
  /** Body text. 16px on phones (never smaller for anything people need to read). */
  body: "text-base",
  /** Secondary text: help lines, subtitles, counts. */
  bodySm: "text-sm",
  /** Captions and small meta text. */
  caption: "text-xs",
  /** A featured price (lookbook). */
  price: "text-sm tracking-[0.08em] tabular-nums md:text-base rtl:tracking-normal",
  /** A price in a product grid. */
  priceSm: "text-xs tracking-[0.08em] tabular-nums md:text-[13px] rtl:tracking-normal",
} as const;

export type TypographyVariant = keyof typeof VARIANTS;

/** The element each variant renders by default. Change it with `as` (e.g. an h1-looking `<h2>`). */
const DEFAULT_ELEMENT: Record<TypographyVariant, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  subtitle: "h3",
  eyebrow: "p",
  label: "span",
  button: "span",
  note: "span",
  body: "p",
  bodySm: "p",
  caption: "span",
  price: "p",
  priceSm: "p",
};

const COLORS = {
  inherit: "",
  ink: "text-ink",
  muted: "text-ink-muted",
  burgundy: "text-burgundy",
  champagne: "text-champagne",
  danger: "text-danger",
} as const;

export type TypographyColor = keyof typeof COLORS;

/**
 * The class string of a text style, for elements that can't be a Typography
 * (e.g. a `next/link` styled as a nav link): `className={typography("label")}`.
 */
export function typography(variant: TypographyVariant, options: { italic?: boolean } = {}): string {
  // Italic only in English: Markazi Text has no italic (Arabic uses color for emphasis).
  return cn(VARIANTS[variant], options.italic && "ltr:italic");
}

type TypographyProps = HTMLAttributes<HTMLElement> & {
  variant?: TypographyVariant;
  /** The HTML element to render. Defaults to the variant's element (h1 for `h1`, p for `body`, ...). */
  as?: ElementType;
  /** Text color from the brand palette. Defaults to the parent's color. */
  color?: TypographyColor;
  /** Italic in English, upright in Arabic. Used for section titles and product names. */
  italic?: boolean;
  /**
   * Extra classes for layout (margins, width, line clamp, alignment).
   * Don't change the font size, font or spacing here: pick another variant instead.
   */
  className?: string;
  /** For `<label as="label">`. */
  htmlFor?: string;
};

/**
 * Text in the brand type scale.
 *
 *   <Typography variant="eyebrow" color="muted">{t("home.products.eyebrow")}</Typography>
 *   <Typography variant="h1" as="h2" italic id="title">{t("home.products.title")}</Typography>
 */
export default function Typography({
  variant = "body",
  as,
  color = "inherit",
  italic = false,
  className,
  ...props
}: TypographyProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];
  return <Component className={cn(typography(variant, { italic }), COLORS[color], className)} {...props} />;
}
