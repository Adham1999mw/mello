import Link, { type LinkProps } from "next/link";
import { cn } from "./cn";

// A rounded two-option switch made of links (e.g. "Sign in | Create account").
// It is navigation between pages, so the items are links with aria-current, not ARIA tabs.

type Item = { href: LinkProps["href"]; label: string; current: boolean };

export default function SegmentedTabs({ items, label, className }: { items: Item[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("grid grid-cols-2 rounded-full bg-ink/[0.06] p-1", className)}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={cn(
            "grid min-h-11 place-items-center rounded-full px-3 text-center text-[14.5px] transition-[background-color,color,box-shadow] duration-200",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy",
            item.current
              ? "bg-white font-medium text-burgundy shadow-[0_1px_2px_rgba(42,4,13,.12),0_4px_12px_-6px_rgba(42,4,13,.25)]"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
