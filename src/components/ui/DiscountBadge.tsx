import { formatPercent } from "@/components/product/formatPrice";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "./cn";

// The sale label: a small flat burgundy rectangle with ivory text, "٢٠٪ خصم" / "20% off".
// One shape everywhere a discount shows (product cards, lookbook), so shoppers learn it once.
// Display only. `className` is for layout only (position, margin), not for restyling.
//   <DiscountBadge percent={20} />
//   <DiscountBadge percent={20} className="absolute start-2 top-2" />

export type DiscountBadgeProps = {
  /** Whole percent off, e.g. 20. */
  percent: number;
  className?: string;
};

export default function DiscountBadge({ percent, className }: DiscountBadgeProps) {
  const { t, locale } = useTranslation();
  return (
    <span
      className={cn(
        "pointer-events-none inline-block shrink-0 rounded-brand bg-burgundy px-2 py-1 text-[11px] leading-none font-medium text-ivory tabular-nums md:text-xs",
        className,
      )}
    >
      {t("home.products.discount", { percent: formatPercent(percent, locale) })}
    </span>
  );
}
