import Link, { type LinkProps } from "next/link";
import { cn } from "./cn";

// A rounded two-option switch ("Sign in | Create account").
//
//   Tabs in one page: give each item `onSelect` and `controls` (the id of its panel). Renders real
//   ARIA tabs (role="tab", aria-selected); give each panel role="tabpanel", the id from `controls`
//   and aria-labelledby={item.id}. Arrow keys move between tabs.
//   Links to other pages: give each item `href`. Renders a <nav> with aria-current.

type Item = {
  label: string;
  current: boolean;
  href?: LinkProps["href"];
  onSelect?: () => void;
  /** Id of the tab button (for the panel's aria-labelledby). */
  id?: string;
  /** Id of the panel this tab shows. */
  controls?: string;
};

const ITEM =
  "relative z-10 grid min-h-11 cursor-pointer place-items-center rounded-full px-3 text-center text-[14.5px] transition-colors duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy";
const CURRENT = "font-medium text-burgundy";
const OTHER = "text-ink-muted hover:text-ink";

// The white pill behind the current item. It slides between items instead of jumping.
// --dir flips the slide in Arabic (RTL), where the first item sits on the right.
const PILL =
  "pointer-events-none absolute inset-y-1 start-1 rounded-full bg-white [--dir:1] rtl:[--dir:-1] " +
  "shadow-[0_1px_2px_rgba(42,4,13,.12),0_4px_12px_-6px_rgba(42,4,13,.25)] " +
  "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none";

function Pill({ items }: { items: Item[] }) {
  const index = items.findIndex((item) => item.current);
  if (index < 0) return null;
  return (
    <span
      aria-hidden
      className={PILL}
      style={{
        width: `calc((100% - 0.5rem) / ${items.length})`,
        transform: `translateX(calc(${index} * 100% * var(--dir)))`,
      }}
    />
  );
}

export default function SegmentedTabs({ items, label, className }: { items: Item[]; label: string; className?: string }) {
  const track = cn("relative grid grid-cols-2 rounded-full bg-ink/[0.06] p-1", className);
  const isTabs = items.every((item) => item.onSelect);

  if (isTabs) {
    const move = (from: number, delta: number) => {
      const target = items[(from + delta + items.length) % items.length];
      target.onSelect?.();
      if (target.id) requestAnimationFrame(() => document.getElementById(target.id!)?.focus());
    };
    return (
      <div role="tablist" aria-label={label} className={track}>
        <Pill items={items} />
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            id={item.id}
            aria-selected={item.current}
            aria-controls={item.controls}
            tabIndex={item.current ? 0 : -1}
            onClick={item.onSelect}
            onKeyDown={(e) => {
              // Arrow keys follow the reading direction (left/right swap in Arabic).
              const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
              if (e.key === "ArrowRight") move(i, rtl ? -1 : 1);
              else if (e.key === "ArrowLeft") move(i, rtl ? 1 : -1);
            }}
            className={cn(ITEM, item.current ? CURRENT : OTHER)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav aria-label={label} className={track}>
      <Pill items={items} />
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href ?? "#"}
          aria-current={item.current ? "page" : undefined}
          className={cn(ITEM, item.current ? CURRENT : OTHER)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
