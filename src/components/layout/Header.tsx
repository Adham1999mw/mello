import Link from "next/link";
import { IconButton, typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { assetPath } from "@/lib/assetPath";
import { useHideOnScroll } from "./useHideOnScroll";
import HeaderAccount from "./HeaderAccount";

// Text links, shown on desktop only (md and up).
const navLinks: { href: string; label: MessageKey }[] = [
  { href: "/shop?sort=new", label: "nav.newIn" },
  { href: "/shop", label: "nav.shop" },
  { href: "/our-story", label: "nav.ourStory" },
];

// Site header, shown on every page (see Layout.tsx): monogram, text links (desktop)
// and icon buttons. Phone styles come first; `md:` classes add the desktop layout.
//
// Scroll animation (same as the Luma website):
// - Phones: the header slides up out of view while you scroll down and slides back as
//   soon as you scroll up. It moves together with the BottomNav (both use useHideOnScroll).
// - Desktop: the header always stays in view.
//
// `overlay` (homepage): near the top the header is transparent and sits on the hero, with
// the design's spacing (cream on burgundy). Further down it becomes a light ivory bar with
// burgundy icons, so it stands out from the burgundy hero and stays readable.
// The row is as tall as the monogram (25px phone, 30px desktop); HeroSection leaves room for it.
// Other pages: always the solid bar.
export default function Header({ overlay = false }: { overlay?: boolean }) {
  const { t, locale } = useTranslation();
  const { hidden, atTop } = useHideOnScroll();

  const position = overlay ? "fixed" : "sticky";
  const look =
    overlay && atTop
      ? "pt-12 md:pt-[30px]"
      : "bg-ivory/95 py-5 text-burgundy shadow-[0_8px_24px_rgb(62_6_20/0.12)] backdrop-blur-md md:py-6";
  const color = overlay && atTop ? "text-champagne" : "";
  // Slide a little past the edge so the shadow goes too.
  const slide = hidden ? "-translate-y-[calc(100%+32px)] md:translate-y-0" : "translate-y-0";

  return (
    <header
      className={`${position} ${look} ${color} ${slide} inset-x-0 top-0 z-50 flex items-center justify-between px-5 md:px-14
                  transition-[translate,background-color,color,padding,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
    >
      <Link href={localePath(locale)} aria-label={t("common.brand")} className="block">
        <Monogram />
      </Link>

      <nav className="hidden gap-[34px] md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={localePath(locale, link.href)}
            className={`${typography("label")} hover:opacity-70`}
          >
            {t(link.label)}
          </Link>
        ))}
      </nav>

      {/* Icons are 22px with 18px between them, like the design. Each button is a 44px tap
          area; the negative margins stop those areas from adding extra space or height,
          and keep the last icon lined up with the page edge. */}
      <div className="-me-[9px] flex items-center">
        {/* <HeaderIcon label={t("nav.search")}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </HeaderIcon> */}
        <HeaderAccount />
        <HeaderIcon label={t("nav.bag")}>
          <path d="M5.5 8.5h13l-1 12h-11z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
        </HeaderIcon>
        <HeaderIcon label={t("nav.menu")}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </HeaderIcon>
      </div>
    </header>
  );
}

// The ND monogram in the current text color: the cream logo image is used as a mask
// over a `currentColor` fill, so it turns burgundy with the rest of the ivory bar.
// The image's edges are partly see-through, so the mask is stacked 3 times to make it solid.
const monogramMask = Array(3).fill(`url(${assetPath("/brand/needle-monogram-cream.webp")})`).join(", ");

function Monogram() {
  return (
    <span
      aria-hidden="true"
      className="block aspect-[596/389] w-[38px] bg-current md:w-[46px]"
      style={{
        maskImage: monogramMask,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskComposite: "add",
      }}
    />
  );
}

// A 44×44px tap area with a 22px line icon inside, in the header's current color.
function HeaderIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <IconButton label={label} className="-mx-0.5 -my-[11px]">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        aria-hidden="true"
      >
        {children}
      </svg>
    </IconButton>
  );
}
