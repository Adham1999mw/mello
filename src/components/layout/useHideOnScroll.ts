import { useEffect, useRef, useState } from "react";

// Ignore scroll jitter smaller than this (px) before showing or hiding.
const SCROLL_DELTA = 8;

/**
 * Phone header + bottom nav auto-hide (same behavior as the Luma website).
 * - `hidden`: `true` while the user scrolls down, `false` as soon as they scroll up,
 *   and always `false` within `topOffset` px of the top of the page.
 * - `atTop`: `true` while the page is within `topOffset` px of the top.
 * Header and BottomNav both use it, so they slide away and come back together.
 */
export function useHideOnScroll(topOffset = 80) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y <= topOffset);
      if (y <= topOffset) {
        setHidden(false);
      } else if (Math.abs(y - lastY.current) >= SCROLL_DELTA) {
        setHidden(y > lastY.current); // scrolling down → hide, up → show
      } else {
        return; // tiny movement: keep the current state and the old position
      }
      lastY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [topOffset]);

  return { hidden, atTop };
}
