import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { localePath } from "@/i18n/static";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { assetPath } from "@/lib/assetPath";
import { BREAKPOINTS } from "@/theme/brand";

// Homepage lookbook: a centered carousel where the look in the middle is large and the
// looks beside it are smaller and faded. Built on Swiper (coverflow effect, no rotation).
// Phone first: 1.6 looks on screen; more from `md` / `lg` up (Swiper breakpoints are min-width).

type Look = { src: string; width: number; height: number; name: MessageKey };

const LOOKS: Look[] = [
  { src: "/lookbook/tracksuit-front.webp", width: 509, height: 795, name: "home.lookbook.looks.front" },
  { src: "/lookbook/tracksuit-back.webp", width: 509, height: 734, name: "home.lookbook.looks.back" },
  { src: "/lookbook/tracksuit-chest-detail.webp", width: 506, height: 795, name: "home.lookbook.looks.chest" },
  { src: "/lookbook/tracksuit-waist-detail.webp", width: 506, height: 734, name: "home.lookbook.looks.waist" },
];

// Swiper's loop needs more slides than are on screen, so the looks are repeated once.
// The real look is always `index % LOOKS.length`.
const SLIDES = [...LOOKS, ...LOOKS];

// How faded a side look is: 0 = invisible, 1 = like the center look.
const SIDE_OPACITY = 0.45;

const pad = (n: number) => String(n).padStart(2, "0");

export default function LookbookSection() {
  const { t, locale, dir } = useTranslation();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);

  const look = LOOKS[active];

  return (
    <section aria-labelledby="lookbook-title" className="overflow-hidden bg-leather/45 py-12 text-ink md:py-20">
      <div className="mb-6 flex items-end justify-between gap-4 px-5 md:mb-10 md:px-14">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-ink-muted uppercase md:text-xs rtl:text-[13px] rtl:tracking-normal">
            {t("home.lookbook.eyebrow")}
          </p>
          <h2
            id="lookbook-title"
            className="mt-2 font-display text-[30px] leading-[1.12] ltr:italic md:text-[44px] rtl:leading-[1.3] rtl:font-medium"
          >
            {t("home.lookbook.title")}
          </h2>
        </div>

        {/* Arrows. In Arabic the row flips, so "previous" sits on the right and points right. */}
        <div className="flex shrink-0 gap-2">
          <ArrowButton label={t("home.lookbook.prev")} onClick={() => swiper?.slidePrev()} direction="prev" />
          <ArrowButton label={t("home.lookbook.next")} onClick={() => swiper?.slideNext()} direction="next" />
        </div>
      </div>

      <Swiper
        // Re-create the carousel when the language (and so the direction) changes.
        key={dir}
        dir={dir}
        modules={[EffectCoverflow, A11y, Keyboard]}
        effect="coverflow"
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 0, scale: 0.8, modifier: 1, slideShadows: false }}
        centeredSlides
        loop
        grabCursor
        keyboard={{ enabled: true, onlyInViewport: true }}
        watchSlidesProgress
        slidesPerView={1.6}
        spaceBetween={8}
        breakpoints={{
          [BREAKPOINTS.md]: { slidesPerView: 2.4, spaceBetween: 16 },
          [BREAKPOINTS.lg]: { slidesPerView: 3.2, spaceBetween: 24 },
        }}
        a11y={{
          prevSlideMessage: t("home.lookbook.prev"),
          nextSlideMessage: t("home.lookbook.next"),
          slideLabelMessage: "",
        }}
        onSwiper={setSwiper}
        onRealIndexChange={(s) => setActive(s.realIndex % LOOKS.length)}
        // Fade the side looks in step with the drag, not only after the slide changes.
        onProgress={fadeSideSlides}
        onSetTransition={(s, duration) => {
          s.slides.forEach((slide) => (slide.style.transitionDuration = `${duration}ms`));
        }}
        className="w-full"
      >
        {SLIDES.map((item, i) => {
          const n = (i % LOOKS.length) + 1;
          return (
            <SwiperSlide
              key={i}
              role="group"
              aria-label={t("home.lookbook.slideLabel", { n, total: LOOKS.length, name: t(item.name) })}
              className="transition-opacity"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-brand bg-leather">
                <Image
                  src={assetPath(item.src)}
                  alt={t(item.name)}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 32vw, (min-width: 768px) 42vw, 64vw"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="mx-auto mt-5 max-w-xl px-5 md:mt-8">
        {/* Name of the center look at the start, its number at the end. */}
        <div className="flex items-baseline justify-between gap-4" aria-live="polite">
          <p className="font-display text-[22px] leading-tight ltr:italic md:text-[26px] rtl:font-medium">{t(look.name)}</p>
          <p className="shrink-0 font-display text-lg tracking-[0.18em] uppercase md:text-xl rtl:tracking-normal">
            {t("home.lookbook.lookLabel", { n: pad(active + 1) })}
          </p>
        </div>

        {/* Segmented progress bar. Each segment is a 44px-tall button that jumps to its look. */}
        <div className="mt-1 flex gap-1.5">
          {LOOKS.map((item, i) => (
            <button
              key={item.src}
              type="button"
              aria-label={t("home.lookbook.goTo", { n: pad(i + 1) })}
              aria-current={i === active ? "true" : undefined}
              onClick={() => swiper?.slideToLoop(i)}
              className="group flex min-h-11 flex-1 items-center"
            >
              <span
                className={`block h-0.5 w-full transition-colors duration-300 ${
                  i === active ? "bg-ink" : "bg-ink/20 group-hover:bg-ink/40"
                }`}
              />
            </button>
          ))}
        </div>

        <Link
          href={localePath(locale, "/products")}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-brand bg-burgundy px-6 text-xs font-medium tracking-[0.24em] text-champagne uppercase hover:bg-burgundy-deep focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-burgundy md:mx-auto md:w-auto rtl:text-sm rtl:tracking-normal"
        >
          {t("home.lookbook.shop")}
        </Link>
      </div>
    </section>
  );
}

// Each slide's `progress` is its distance from the center in slides (0 = center).
function fadeSideSlides(swiper: SwiperInstance) {
  swiper.slides.forEach((slide) => {
    const distance = Math.min(Math.abs((slide as HTMLElement & { progress?: number }).progress ?? 0), 1);
    slide.style.opacity = String(1 - (1 - SIDE_OPACITY) * distance);
  });
}

function ArrowButton({ label, onClick, direction }: { label: string; onClick: () => void; direction: "prev" | "next" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`size-4 fill-none stroke-current stroke-[1.5] ${direction === "prev" ? "rotate-180" : ""} rtl:-scale-x-100`}
      >
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
