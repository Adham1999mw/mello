import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Typography } from "@/components/ui";
import { isHomePage, localePath, stripLocale } from "@/i18n/static";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { useHideOnScroll } from "./useHideOnScroll";

// Phone-only tab bar fixed to the bottom of the screen (same pattern as the Luma website).
// It slides down out of view while you scroll down and comes back when you scroll up,
// together with the header. Light ivory bar with burgundy for the active tab.
// On the homepage it never shows in the first quarter of the hero.
// Hidden from `md` (768px) up, where the header has text links.

type Tab = { href: string; label: MessageKey; icon: React.ReactNode };

const tabs: Tab[] = [
  {
    href: "/",
    label: "nav.home",
    icon: (
      <>
        <path d="M4 10.5 12 4l8 6.5V20H4z" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
  },
  {
    href: "/shop",
    label: "nav.shop",
    // Clothes hanger
    icon: <path d="M10 6a2 2 0 1 1 2 2v1.5L3.5 15.6a.8.8 0 0 0 .5 1.4h16a.8.8 0 0 0 .5-1.4L12 9.5" />,
  },
  {
    href: "/bag",
    label: "nav.bag",
    icon: (
      <>
        <path d="M5.5 8.5h13l-1 12h-11z" />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
      </>
    ),
  },
  {
    href: "/sign-in",
    label: "nav.account",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
      </>
    ),
  },
];

export default function BottomNav() {
  const { t, locale } = useTranslation();
  const { pathname, asPath } = useRouter();
  const { hidden } = useHideOnScroll();
  const inHeroTop = useInHeroTop(pathname);

  // Hidden while scrolling down (like the header), shown on scroll up,
  // but never in the first quarter of the hero.
  const hide = hidden || inHeroTop;

  // Home is active only on the home page; other tabs also on their sub-pages (e.g. /shop/dresses).
  const currentPath = stripLocale(asPath); // "/en/shop/" -> "/shop"
  const isActive = (href: string) => (href === "/" ? isHomePage(pathname) : currentPath.startsWith(href));

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 flex border-t border-burgundy/10 bg-ivory/95 px-2 pt-2.5
                  pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(62_6_20/0.12)] backdrop-blur-md
                  transition-[translate] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden
                  ${hide ? "translate-y-[calc(100%+32px)]" : "translate-y-0"}`}
      inert={hide}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);

        return (
          <Link
            key={tab.href}
            href={localePath(locale, tab.href)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1.5 transition-colors
                        ${active ? "text-burgundy" : "text-ink/50 hover:text-ink/75"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              {tab.icon}
            </svg>
            <Typography variant="note">
              {t(tab.label)}
            </Typography>
          </Link>
        );
      })}
    </nav>
  );
}

// True while the page is scrolled less than a quarter of the way into the hero (`id="hero"`).
// Pages without a hero always return false.
function useInHeroTop(pathname: string) {
  // The homepage opens at the top of its hero, so start hidden there (no flash on load).
  const [inTop, setInTop] = useState(isHomePage(pathname));

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const update = () => setInTop(window.scrollY < hero.offsetHeight / 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      setInTop(false); // leaving this page: the next one may have no hero
    };
  }, [pathname]); // check again after moving to another page

  return inTop;
}
