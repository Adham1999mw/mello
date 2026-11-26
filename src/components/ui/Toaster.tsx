import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import Typography from "./Typography";
import { cn } from "./cn";
import { toast, useToasts, type Toast } from "./toast";

// Where toasts appear. Mounted once in _app.tsx; show one with toast.success({ title, message }).
//
// Look: a quiet white card of frosted glass with a hairline border and a soft long shadow, like a
// boutique's printed note. A small burgundy seal whose check draws itself in, the title in the
// display serif, a hairline timer along the bottom.
//
// Motion: toasts stack like cards (newest in front, older ones tucked behind). Hover, focus or tap
// the stack and it fans out. Everything moves on one soft curve (.toast-ease in globals.css).
//
//   Phones   full width at the top, under the status bar (the tab bar owns the bottom).
//   ≥768px   380px wide, top corner on the reading-end side.
//
// The timer pauses while the stack is open or hovered, or the tab is hidden.
// Swipe up or sideways to dismiss.

const GAP = 10;
/** How far each tucked card shows below the one in front. */
const PEEK = 9;
const VISIBLE = 3;
const EXIT_MS = 380;

export default function Toaster() {
  const toasts = useToasts();
  const { t } = useTranslation();
  const [pageHidden, setPageHidden] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    const update = () => setPageHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // A single toast never fans out; close the stack when it gets down to one.
  const count = toasts.length;
  if (tapped && count <= 1) setTapped(false);

  const expanded = count > 1 && (hover || focusWithin || tapped);
  const paused = pageHidden || expanded || hover;

  const frontHeight = heights[toasts[0]?.id] ?? 0;
  const offsets: number[] = [];
  let total = 0;
  for (const item of toasts) {
    offsets.push(total);
    total += (heights[item.id] ?? 0) + GAP;
  }
  const listHeight =
    count === 0 ? 0 : expanded ? total - GAP : frontHeight + PEEK * Math.min(count - 1, VISIBLE - 1);

  return (
    <section
      aria-label={t("toast.region")}
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        "pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[1400]",
        "md:inset-x-auto md:end-6 md:top-6 md:w-[380px]",
      )}
    >
      <ol
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onPointerDown={(e) => e.pointerType !== "mouse" && setTapped(true)}
        onFocus={() => setFocusWithin(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocusWithin(false)}
        className={cn("toast-ease relative transition-[height] duration-500", count > 0 && "pointer-events-auto")}
        style={{ height: listHeight }}
      >
        {toasts.map((item, index) => (
          <ToastCard
            key={item.id}
            toast={item}
            index={index}
            expanded={expanded}
            offset={offsets[index]}
            frontHeight={frontHeight}
            paused={paused}
            closeLabel={t("toast.close")}
            onHeight={(h) => setHeights((prev) => (prev[item.id] === h ? prev : { ...prev, [item.id]: h }))}
          />
        ))}
      </ol>
    </section>
  );
}

type CardProps = {
  toast: Toast;
  index: number;
  expanded: boolean;
  offset: number;
  frontHeight: number;
  paused: boolean;
  closeLabel: string;
  onHeight: (height: number) => void;
};

function ToastCard({ toast: item, index, expanded, offset, frontHeight, paused, closeLabel, onHeight }: CardProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [height, setHeight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState<null | { x: number; y: number }>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  // Measure for the stack, and again if the text wraps differently (rotation, font load).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setHeight(el.offsetHeight);
      onHeight(el.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enter one frame after mounting, as a transition, so it blends with the stack moving down.
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => toast.dismiss(item.id), EXIT_MS);
    return () => clearTimeout(id);
  }, [leaving, item.id]);

  const close = (x = 0, y = -24) => setLeaving({ x, y });

  function onPointerDown(e: PointerEvent<HTMLLIElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLLIElement>) {
    const s = start.current;
    if (s?.id !== e.pointerId) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    // Sideways follows the finger; downward resists (it is not a way out).
    setDrag(Math.abs(x) > Math.abs(y) ? { x, y: 0 } : { x: 0, y: y < 0 ? y : y * 0.15 });
  }
  function onPointerEnd(e: PointerEvent<HTMLLIElement>) {
    if (start.current?.id !== e.pointerId) return;
    start.current = null;
    if (Math.abs(drag.x) > 70) close(Math.sign(drag.x) * 420, 0);
    else if (drag.y < -36) close(0, -(height || frontHeight));
    else setDrag({ x: 0, y: 0 });
  }

  // Where this card sits.
  const hiddenBehind = !expanded && index >= VISIBLE;
  let y = 0;
  let scale = 1;
  if (!mounted) {
    y = -(height || 80) * 0.6;
    scale = 0.96;
  } else if (expanded) {
    y = offset;
  } else if (index > 0) {
    // Tucked behind the front card: its bottom edge peeks out, a little smaller each step.
    const depth = Math.min(index, VISIBLE - 1);
    scale = 1 - depth * 0.045;
    y = frontHeight + depth * PEEK - height * scale;
  }
  if (leaving) y += leaving.y;

  const dragging = drag.x !== 0 || drag.y !== 0;
  const style: CSSProperties = {
    transform: `translate3d(${(leaving?.x ?? 0) + drag.x}px, ${y + drag.y}px, 0) scale(${leaving ? scale * 0.96 : scale})`,
    opacity: !mounted || leaving || hiddenBehind ? 0 : dragging ? Math.max(0.3, 1 - Math.abs(drag.x) / 300) : 1,
    zIndex: 100 - index,
    transitionDuration: dragging ? "0ms" : leaving ? `${EXIT_MS}ms` : "560ms",
  };

  // Tucked cards show only their edge, so their content fades out of the way.
  const contentHidden = !expanded && index > 0;

  return (
    <li
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-hidden={hiddenBehind || undefined}
      style={style}
      className={cn(
        "toast-ease absolute inset-x-0 top-0 origin-top touch-none transition-[transform,opacity] select-none will-change-transform",
        "overflow-hidden rounded-[18px] border border-ink/[0.07] bg-white/[0.92] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_1px_1px_rgba(42,4,13,.04),0_6px_14px_-6px_rgba(42,4,13,.12),0_24px_48px_-20px_rgba(42,4,13,.28)]",
        leaving && "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "toast-ease flex items-start gap-3.5 py-4 ps-4 pe-1.5 transition-opacity duration-300",
          contentHidden && "opacity-0",
        )}
      >
        <Seal tone={item.tone} />
        <div className="min-w-0 flex-1 pt-[3px]">
          <Typography as="p" variant="h4" color="burgundy">
            {item.title}
          </Typography>
          {item.message && (
            <Typography variant="bodySm" color="muted" className="mt-1 break-words">
              {item.message}
            </Typography>
          )}
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => close()}
          tabIndex={contentHidden ? -1 : 0}
          className="-my-1.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted/70 transition-colors duration-200 hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-burgundy"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Hairline timer: when it runs out, the toast leaves. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-burgundy/[0.06]">
        <span
          className="toast-timer block h-full bg-burgundy/35"
          style={{
            animationDuration: `${item.duration}ms`,
            animationPlayState: paused || leaving || dragging ? "paused" : "running",
          }}
          onAnimationEnd={() => close()}
        />
      </span>
    </li>
  );
}

function Seal({ tone }: { tone: Toast["tone"] }) {
  return (
    <span aria-hidden className="toast-seal relative grid size-9 shrink-0 place-items-center rounded-full bg-burgundy text-champagne">
      {/* A soft halo, like light around a wax seal */}
      <span className="absolute -inset-1 rounded-full bg-burgundy/[0.08]" />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative">
        {tone === "success" ? (
          <path className="toast-check" d="M5.5 12.5l4 4L18.5 7.5" pathLength={1} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M12 11v6M12 7.5v.01" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}
