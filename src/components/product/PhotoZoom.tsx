import { useState } from "react";
import Image from "next/image";
import Dialog from "@mui/material/Dialog";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Zoom } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/zoom";
import { IconButton, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { formatNumber } from "./formatPrice";
import { localized } from "@/lib/catalog/products";
import { ArrowIcon, Thumbs, type GalleryImage } from "./GalleryParts";


/**
 * Full-screen photo view on burgundy: swipe between photos, tap (or pinch) to zoom in,
 * tap again to zoom out. Esc or the close button returns to the page on the photo
 * last seen. MUI Dialog gives the focus trap, Esc and the page scroll lock.
 */
export default function PhotoZoom({
  images,
  name,
  startAt,
  onClose,
}: {
  images: GalleryImage[];
  name: string;
  startAt: number;
  /** Gets the index of the photo shown when it closed. */
  onClose: (index: number) => void;
}) {
  const { t, locale, dir } = useTranslation();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [index, setIndex] = useState(startAt);
  const total = images.length;
  const alt = (img: GalleryImage) => localized(img, "alt", locale) || name;
  const close = () => onClose(index);

  return (
    <Dialog
      open
      fullScreen
      onClose={close}
      aria-label={t("product.gallery.label")}
      slotProps={{ paper: { className: "bg-burgundy-deep text-champagne", sx: { backgroundImage: "none" } } }}
    >
      <div className="grid h-full w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-3 ps-5 pe-2 py-1.5">
          <Typography variant="label" as="span" className="tabular-nums" aria-live="polite">
            {t("product.gallery.photoOf", { n: formatNumber(index + 1, locale), total: formatNumber(total, locale) })}
          </Typography>
          <IconButton label={t("product.gallery.close")} tone="champagne" onClick={close}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>

        <div className="relative min-h-0 min-w-0">
          <Swiper
            dir={dir}
            modules={[A11y, Keyboard, Zoom]}
            initialSlide={startAt}
            slidesPerView={1}
            keyboard={{ enabled: true }}
            // Pinch to zoom; one tap toggles it (see onClick). No double-tap, so one tap is enough.
            zoom={{ maxRatio: 2.5, toggle: false }}
            onClick={(s) => s.zoom.toggle()}
            a11y={{ prevSlideMessage: t("product.gallery.prev"), nextSlideMessage: t("product.gallery.next") }}
            onSwiper={setSwiper}
            onSlideChange={(s) => setIndex(s.activeIndex)}
            className="h-full"
          >
            {images.map((img) => (
              <SwiperSlide key={img.url} zoom className="cursor-zoom-in">
                <div className="relative h-full w-full">
                  <Image src={img.url} alt={alt(img)} fill sizes="100vw" className="object-contain" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {index > 0 && (
            <IconButton
              label={t("product.gallery.prev")}
              tone="champagne"
              onClick={() => swiper?.slidePrev()}
              className="absolute start-3 top-1/2 z-10 hidden size-12 -translate-y-1/2 rounded-full bg-champagne/10 md:flex"
            >
              <ArrowIcon direction="back" />
            </IconButton>
          )}
          {index < total - 1 && (
            <IconButton
              label={t("product.gallery.next")}
              tone="champagne"
              onClick={() => swiper?.slideNext()}
              className="absolute end-3 top-1/2 z-10 hidden size-12 -translate-y-1/2 rounded-full bg-champagne/10 md:flex"
            >
              <ArrowIcon direction="forward" />
            </IconButton>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Typography variant="caption" className="opacity-60">
            {t("product.gallery.zoomHint")}
          </Typography>
          {total > 1 && (
            <Thumbs
              images={images}
              current={index}
              onPick={(i) => swiper?.slideTo(i)}
              altOf={alt}
              tone="dark"
              className="max-w-full justify-start sm:justify-center"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
