import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { IconButton, cn } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { formatNumber } from "./formatPrice";
import { localized } from "@/lib/catalog/products";
import { ArrowIcon, Thumbs, type GalleryImage } from "./GalleryParts";
import PhotoZoom from "./PhotoZoom";

export type { GalleryImage };

type Props = {
  images: GalleryImage[];
  /** Product name: the alt text of photos that have none. */
  name: string;
  /**
   * "page": thumbnails under the photo on phones, in a column beside it from md.
   * "compact": thumbnails always under the photo (Quick view).
   */
  layout?: "page" | "compact";
  /** Load the first photo right away (it is the page's main image). */
  priority?: boolean;
  /** Shown over the photo, e.g. <DiscountBadge className="absolute start-4 top-4" />. */
  children?: React.ReactNode;
};

/**
 * Product photos: swipe between them (Swiper), pick one from the thumbnails, or tap it to
 * open the full-screen view with zoom. Works in Arabic (RTL) too. Used by the product page
 * and, later, Quick view; it only needs the photos, so both share it.
 * Phone first: full width, 2:3 photo, thumbnails in a row that overlaps the photo's bottom.
 */
export default function ProductGallery({ images, name, layout = "page", priority = false, children }: Props) {
  const { t, locale, dir } = useTranslation();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [index, setIndex] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const page = layout === "page";
  const total = images.length;
  const alt = (img: GalleryImage) => localized(img, "alt", locale) || name;

  if (total === 0) {
    return <div className="aspect-[2/3] w-full bg-leather md:rounded-brand" aria-hidden="true" />;
  }

  // The zoom view can change the photo; keep the gallery on the same one when it closes.
  const closeZoom = (last: number) => {
    setZoomAt(null);
    swiper?.slideTo(last, 0);
  };

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1",
        page && "md:grid-cols-[84px_minmax(0,1fr)] md:items-start md:gap-[18px]",
      )}
    >
      <div className={cn("relative min-w-0 overflow-hidden bg-leather", page ? "md:col-start-2 md:row-start-1 md:rounded-brand" : "rounded-brand")}>
        <Swiper
          dir={dir}
          modules={[A11y, Keyboard]}
          slidesPerView={1}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{
            prevSlideMessage: t("product.gallery.prev"),
            nextSlideMessage: t("product.gallery.next"),
            slideLabelMessage: t("product.gallery.photoOf", { n: "{{index}}", total: "{{slidesLength}}" }),
          }}
          onSwiper={setSwiper}
          onSlideChange={(s) => setIndex(s.activeIndex)}
          aria-label={t("product.gallery.label")}
          className="w-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.url}>
              <button
                type="button"
                onClick={() => setZoomAt(i)}
                aria-label={t("product.gallery.zoom")}
                className="relative block aspect-[2/3] w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-burgundy"
              >
                <Image
                  src={img.url}
                  alt={alt(img)}
                  fill
                  sizes={page ? "(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 420px, 100vw"}
                  priority={priority && i === 0}
                  loading={priority && i === 0 ? undefined : "lazy"}
                  className="object-cover"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        {children}

        {total > 1 && (
          <span
            className={cn(
              "pointer-events-none absolute start-4 z-10 rounded-full bg-ivory/85 px-3 py-1 text-xs tracking-[0.1em] text-ink tabular-nums backdrop-blur-sm",
              page ? "bottom-10 md:bottom-4" : "bottom-4",
            )}
            aria-hidden="true"
          >
            {formatNumber(index + 1, locale)} / {formatNumber(total, locale)}
          </span>
        )}

        <IconButton
          label={t("product.gallery.zoom")}
          tone="burgundy"
          onClick={() => setZoomAt(index)}
          className={cn(
            "absolute end-3 z-10 rounded-full bg-ivory/85 backdrop-blur-sm hover:bg-ivory",
            page ? "bottom-8 md:bottom-3" : "bottom-3",
          )}
        >
          <ZoomIcon />
        </IconButton>

        {/* Arrows: from md only (phones swipe). Hidden at the first / last photo. */}
        {index > 0 && (
          <IconButton
            label={t("product.gallery.prev")}
            tone="burgundy"
            onClick={() => swiper?.slidePrev()}
            className="absolute start-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 rounded-full bg-ivory/90 shadow-md hover:bg-ivory md:flex"
          >
            <ArrowIcon direction="back" />
          </IconButton>
        )}
        {index < total - 1 && (
          <IconButton
            label={t("product.gallery.next")}
            tone="burgundy"
            onClick={() => swiper?.slideNext()}
            className="absolute end-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 rounded-full bg-ivory/90 shadow-md hover:bg-ivory md:flex"
          >
            <ArrowIcon direction="forward" />
          </IconButton>
        )}
      </div>

      {total > 1 && (
        <Thumbs
          images={images}
          current={index}
          onPick={(i) => swiper?.slideTo(i)}
          altOf={alt}
          className={
            page
              ? "relative z-10 -mt-6 rounded-t-sheet bg-ivory px-4 pt-[18px] pb-1 md:sticky md:top-28 md:col-start-1 md:row-start-1 md:mt-0 md:flex-col md:gap-3 md:overflow-visible md:rounded-none md:bg-transparent md:p-0"
              : "pt-3"
          }
          large={page}
        />
      )}

      {zoomAt !== null && (
        <PhotoZoom images={images} name={name} startAt={zoomAt} onClose={closeZoom} />
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" strokeLinecap="round" />
    </svg>
  );
}
