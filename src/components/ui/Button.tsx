import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";
import { typography } from "./Typography";

// Needle buttons. One component for every button and button-looking link in the store
// and the admin. Pick the look with `variant` (shape) and `tone` (color):
//
//   variant  solid    filled, for the main action on a screen
//            outline  1px border, for the second action
//            text     no border, for quiet actions (Cancel, Remove)
//            link     underlined text, for "View all" style links
//
//   tone     burgundy   on light backgrounds (ivory, white, leather). The default.
//            champagne  on burgundy backgrounds (hero, admin top bar)
//            ink        neutral, on light backgrounds
//            danger     delete and other actions that can't be undone
//
// Mobile first: every size is at least 44px tall (LAYOUT.minTapTarget), and `fullWidth="mobile"`
// makes the button full width on phones and its natural width from `md` up.
// Pass `href` to render a `next/link` instead of a `<button>`.

export type ButtonVariant = "solid" | "outline" | "text" | "link";
export type ButtonTone = "burgundy" | "champagne" | "ink" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Full class names (not built from pieces) so Tailwind can find them.
const TONES: Record<ButtonTone, Record<ButtonVariant, string> & { focus: string }> = {
  burgundy: {
    solid: "border-burgundy bg-burgundy text-champagne hover:border-burgundy-deep hover:bg-burgundy-deep",
    outline: "border-burgundy/40 text-burgundy hover:border-burgundy hover:bg-burgundy/5",
    text: "border-transparent text-burgundy hover:bg-burgundy/5",
    link: "border-burgundy/30 text-burgundy hover:border-burgundy",
    focus: "focus-visible:outline-burgundy",
  },
  champagne: {
    solid: "border-champagne bg-champagne text-burgundy-deep hover:border-ivory hover:bg-ivory",
    outline: "border-champagne/45 text-champagne hover:border-champagne hover:bg-champagne/10",
    text: "border-transparent text-champagne hover:bg-champagne/10",
    link: "border-champagne/40 text-champagne hover:border-champagne",
    focus: "focus-visible:outline-champagne",
  },
  ink: {
    solid: "border-ink bg-ink text-ivory hover:border-ink/85 hover:bg-ink/85",
    outline: "border-ink/30 text-ink hover:border-ink hover:bg-ink/5",
    text: "border-transparent text-ink hover:bg-ink/5",
    link: "border-ink/30 text-ink hover:border-ink",
    focus: "focus-visible:outline-ink",
  },
  danger: {
    solid: "border-danger bg-danger text-white hover:border-danger/85 hover:bg-danger/85",
    outline: "border-danger/40 text-danger hover:border-danger hover:bg-danger/5",
    text: "border-transparent text-danger hover:bg-danger/5",
    link: "border-danger/30 text-danger hover:border-danger",
    focus: "focus-visible:outline-danger",
  },
};

// Heights: sm 44px, md 48px, lg 48px on phones and 52px from md up (the hero buttons).
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4",
  md: "min-h-12 px-6",
  lg: "min-h-12 px-[26px] md:min-h-[52px] md:px-8",
};

const WIDTHS = {
  auto: "",
  full: "w-full",
  mobile: "w-full md:w-auto",
} as const;

type CommonProps = {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  /** Ignored by `variant="link"`, which is always a 44px tall text link. */
  size?: ButtonSize;
  /** `true`: always full width. `"mobile"`: full width on phones, natural width from `md` up. */
  fullWidth?: boolean | "mobile";
  /** An icon before the text (on the right in Arabic). */
  startIcon?: ReactNode;
  /** An icon after the text (on the left in Arabic). */
  endIcon?: ReactNode;
  /** Extra classes for layout only (margins, flex, position). Use the props for the look. */
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps & Omit<ComponentProps<typeof Link>, keyof CommonProps>;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** The class string of a button look, for the rare element that can't be a Button. */
export function buttonClasses({
  variant = "solid",
  tone = "burgundy",
  size = "md",
  fullWidth = false,
}: Pick<CommonProps, "variant" | "tone" | "size" | "fullWidth"> = {}): string {
  const width = fullWidth === "mobile" ? WIDTHS.mobile : fullWidth ? WIDTHS.full : WIDTHS.auto;
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-center transition-colors duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px]",
    "disabled:pointer-events-none disabled:opacity-40",
    typography("button"),
    variant === "link" ? "min-h-11 rounded-none border-b" : cn("rounded-brand border", SIZES[size]),
    TONES[tone][variant],
    TONES[tone].focus,
    width,
  );
}

/**
 *   <Button onClick={save}>{t("admin.form.save")}</Button>
 *   <Button href={localePath(locale, "/shop")} tone="champagne" size="lg">{t("home.hero.shop")}</Button>
 *   <Button variant="text" tone="danger" onClick={remove}>{t("admin.form.remove")}</Button>
 */
export default function Button(props: ButtonProps) {
  const { variant, tone, size, fullWidth, startIcon, endIcon, className, children, ...rest } = props;
  const classes = cn(buttonClasses({ variant, tone, size, fullWidth }), className);
  const content = (
    <>
      {startIcon && <span aria-hidden="true" className="-ms-1 flex shrink-0">{startIcon}</span>}
      {children}
      {endIcon && <span aria-hidden="true" className="-me-1 flex shrink-0">{endIcon}</span>}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as Omit<ButtonAsLink, keyof CommonProps>)} className={classes}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as Omit<ButtonAsButton, keyof CommonProps>;
  return (
    // `type="button"` by default so a Button inside a form doesn't submit it by accident.
    <button type={type} {...buttonProps} className={classes}>
      {content}
    </button>
  );
}
