import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

// A 44×44px button with only an icon in it (LAYOUT.minTapTarget).
//
//   variant  plain    just the icon (header icons, admin move up/down). The default.
//            outline  round with a thin border, fills on hover (carousel arrows)
//   tone     current  takes the parent's text color (cream on the hero, burgundy on ivory). The default.
//            ink | burgundy | champagne | danger
//
// `label` is required: it is what screen readers say, because there is no visible text.

export type IconButtonVariant = "plain" | "outline";
export type IconButtonTone = "current" | "ink" | "burgundy" | "champagne" | "danger";

const TONES: Record<IconButtonTone, Record<IconButtonVariant, string>> = {
  current: {
    plain: "text-current hover:opacity-70 focus-visible:outline-current",
    outline: "border-current/25 text-current hover:border-current focus-visible:outline-current",
  },
  ink: {
    plain: "text-ink hover:bg-ink/5 focus-visible:outline-ink",
    outline: "border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-ivory focus-visible:outline-ink",
  },
  burgundy: {
    plain: "text-burgundy hover:bg-burgundy/5 focus-visible:outline-burgundy",
    outline:
      "border-burgundy/25 text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-champagne focus-visible:outline-burgundy",
  },
  champagne: {
    plain: "text-champagne hover:bg-champagne/10 focus-visible:outline-champagne",
    outline:
      "border-champagne/45 text-champagne hover:border-champagne hover:bg-champagne hover:text-burgundy-deep focus-visible:outline-champagne",
  },
  danger: {
    plain: "text-danger hover:bg-danger/5 focus-visible:outline-danger",
    outline: "border-danger/30 text-danger hover:border-danger hover:bg-danger hover:text-white focus-visible:outline-danger",
  },
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** What the button does, read by screen readers (e.g. t("nav.search")). */
  label: string;
  variant?: IconButtonVariant;
  tone?: IconButtonTone;
  /** The icon, usually a 20–22px `<svg aria-hidden="true">` drawn with `currentColor`. */
  children: ReactNode;
  /** Extra classes for layout only (margins, position). */
  className?: string;
};

export default function IconButton({
  label,
  variant = "plain",
  tone = "current",
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "flex size-11 shrink-0 cursor-pointer items-center justify-center transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "outline" ? "rounded-full border" : "rounded-brand",
        TONES[tone][variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
