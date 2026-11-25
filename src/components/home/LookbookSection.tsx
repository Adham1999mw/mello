import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/config";
import { assetPath } from "@/lib/assetPath";
import { toLookbookItem } from "@/lib/catalog/products";
import type { LookbookItem } from "@/lib/catalog/types";
import { useListProductsQuery } from "@/store/services/products";
import { BREAKPOINTS } from "@/theme/brand";
import { formatPrice } from "@/components/product/formatPrice";
import { Button, DiscountBadge, IconButton, Typography } from "@/components/ui";

// Homepage lookbook: a centered carousel where the look in the middle is large and the
// looks beside it are smaller and faded. Built on Swiper (coverflow effect, no rotation).
// Phone first: 1.6 looks on screen; more from `md` / `lg` up (Swiper breakpoints are min-width).


// How faded a side look is: 0 = invisible, 1 = like the center look.
const SIDE_OPACITY = 0.45;

const pad = (n: number) => String(n).padStart(2, "0");

// Most looks the carousel shows.
const MAX_LOOKS = 12;

// The looks are the products marked "featured" in the admin (`is_featured`), from the same
// products API as the grid with the `featured` filter. Each shows its special lookbook image,
// or its cover photo when it has none. Newest first.
// While loading, an empty frame of the same height holds the space; with no featured
// products (or an error) the section is left out.
export default function LookbookSection() {
  const { locale } = useTranslation();
  const { data, isLoading } = useListProductsQuery({ featured: true, sort: "newest", pageSize: MAX_LOOKS, locale });

  if (isLoading) return <LookbookSkeleton />;
  const items = (data?.items ?? []).map(toLookbookItem).filter((item): item is LookbookItem => item !== null);
  if (items.length === 0) return null;
  return <Lookbook items={items} />;
}

function LookbookSkeleton() {
  return (
    <section aria-hidden="true" className="overflow-hidden bg-leather/45 py-12 md:py-20">
      <div className="mx-auto h-[80vw] max-h-[60svh] w-1/3 max-w-[340px] animate-pulse rounded-brand bg-leather md:h-[60svh] md:max-h-[640px]" />
    </section>
  );
}

function Lookbook({ items }: { items: LookbookItem[] }) {
  const { t, locale, dir } = useTranslation();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);

  // Swiper's loop needs more slides than are on screen, so the items are repeated until
  // there are enough. The real item is always `index % items.length`.
  const slides = Array.from({ length: Math.ceil(8 / items.length) }, () => items).flat();
  const item = items[active] ?? items[0];
  const name = locale === "ar" ? item.name_ar : item.name_en;
  const hasSale = item.compare_at_price != null && item.compare_at_price > item.price;
  // Sale badge: how much lower the price is than the old one, as a whole percent.
  // Hidden when there is no sale or the look is sold out (same rule as the product cards).
  const discount = hasSale ? Math.round(((item.compare_at_price! - item.price) / item.compare_at_price!) * 100) : 0;
  const showDiscount = item.in_stock && discount >= 1;
  const href = localePath(locale, `/products/${item.slug}`);

  return (
    <section aria-labelledby="lookbook-title" className="overflow-hidden bg-leather/45 py-12 text-ink md:py-20">
      <div className="mb-6 flex items-end justify-between gap-4 px-5 md:mb-10 md:px-14">
        <div>
          <Typography variant="eyebrow" color="muted">
            {t("home.lookbook.eyebrow")}
          </Typography>
          <Typography variant="h1" as="h2" italic id="lookbook-title" className="mt-2">
            {t("home.lookbook.title")}
          </Typography>
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
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 0, scale: 0.75, modifier: 1, slideShadows: false }}
        centeredSlides
        // Tapping a side look slides it to the center.
        slideToClickedSlide
        loop
        grabCursor
        keyboard={{ enabled: true, onlyInViewport: true }}
        watchSlidesProgress
        // Three whole looks on screen at every width: the center one large, one on each side.
        slidesPerView={3}
        spaceBetween={0}
        breakpoints={{
          [BREAKPOINTS.md]: { spaceBetween: 16 },
          [BREAKPOINTS.lg]: { spaceBetween: 24 },
        }}
        a11y={{
          prevSlideMessage: t("home.lookbook.prev"),
          nextSlideMessage: t("home.lookbook.next"),
          slideLabelMessage: "",
        }}
        onSwiper={setSwiper}
        onRealIndexChange={(s) => setActive(s.realIndex % items.length)}
        // Fade the side looks in step with the drag, not only after the slide changes.
        onProgress={fadeSideSlides}
        onSetTransition={(s, duration) => {
          s.slides.forEach((slide) => (slide.style.transitionDuration = `${duration}ms`));
        }}
        // On wide screens the carousel is capped so three looks stay close together.
        className="mx-auto w-full max-w-5xl"
      >
        {slides.map((slide, i) => {
          const n = (i % items.length) + 1;
          const slideName = locale === "ar" ? slide.name_ar : slide.name_en;
          return (
            <SwiperSlide
              key={`${slide.id}-${i}`}
              role="group"
              aria-label={t("home.lookbook.slideLabel", { n, total: items.length, name: slideName })}
              className="transition-opacity"
            >
              {/* Height follows the screen width on phones, the screen height on larger screens,
                  and never takes more than ~60% of the visible height. */}
              <div className="relative h-[80vw] max-h-[60svh] md:h-[60svh] md:max-h-[640px]">
                <Image
                  src={imageSrc(slide.image_url)}
                  alt={altText(slide, locale)}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 340px, 34vw"
                  className={slide.image_fit === "contain" ? "object-contain" : "object-cover"}
                />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="mx-auto mt-5 max-w-xl px-5 md:mt-8">
        {/* The center item: name and look number, then whether it's in stock and its price. */}
        <div aria-live="polite">
          <div className="flex items-baseline justify-between gap-4">
            <Typography variant="h3" as="p" italic>
              {name}
            </Typography>
            <Typography variant="h3" as="p" className="shrink-0 tracking-[0.18em] uppercase rtl:tracking-normal">
              {t("home.lookbook.lookLabel", { n: pad(active + 1) })}
            </Typography>
          </div>
          <div className="mt-1 flex items-center justify-between gap-4">
            {showDiscount && <DiscountBadge percent={discount} />}
            <Typography variant="price" className="ms-auto shrink-0">
              {item.in_stock ? (
                <>
                  {hasSale && <s className="me-2 text-ink-muted opacity-70">{formatPrice(item.compare_at_price!, locale)}</s>}
                  <span className={hasSale ? "text-burgundy" : undefined}>{formatPrice(item.price, locale)}</span>
                </>
              ) : (
                <span className="text-ink-muted">{t("home.products.soldOut")}</span>
              )}
            </Typography>
          </div>
        </div>

        {/* Segmented progress bar. Each segment is a 44px-tall button that jumps to its look. */}
        <div className="mt-1 flex gap-1.5">
          {items.map((_, i) => (
            <button
              // Index, not name: looks can share a name, and this list never reorders.
              key={i}
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

        {/* Opens the center item's details page. */}
        <div className="mt-4 flex justify-center">
          <Button href={href} fullWidth="mobile">
            {t("home.lookbook.details")}
          </Button>
        </div>
      </div>
    </section>
  );
}

// Storage images are full URLs; `/public` files need the GitHub Pages base path.
function imageSrc(url: string): string {
  return url.startsWith("/") ? assetPath(url) : url;
}

function altText(item: LookbookItem, locale: Locale): string {
  return (locale === "ar" ? item.image_alt_ar ?? item.name_ar : item.image_alt_en ?? item.name_en) ?? "";
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
    <IconButton label={label} onClick={onClick} variant="outline" tone="ink">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`size-4 fill-none stroke-current stroke-[1.5] ${direction === "prev" ? "rotate-180" : ""} rtl:-scale-x-100`}
      >
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconButton>
  );
}
