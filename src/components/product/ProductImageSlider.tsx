import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/catalog/products";
import type { CardImage } from "@/lib/catalog/types";
import { useTranslation } from "@/i18n/useTranslation";

type Props = {
  images: CardImage[];
  /** Used as the alt text when a photo has none. */
  name: string;
  /** Where tapping a photo goes (the product page). */
  href: string;
  /** Shown over the photos, e.g. a "Sold out" badge. */
  children?: React.ReactNode;
};

// Swipeable product photos with bullets, built on the browser's own scrolling:
// - the photos sit in a row that scrolls sideways and snaps to one photo at a time,
//   so swiping on a phone (or a trackpad) feels native and works in Arabic (RTL) too;
// - the bullets show which photo is in view, and tapping one scrolls to that photo.
export default function ProductImageSlider({ images, name, href, children }: Props) {
  const { t, locale } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // Watch which photo is mostly in view, and light up its bullet.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(slides.indexOf(entry.target));
        }
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images]);

  function goTo(index: number) {
    const slide = trackRef.current?.children[index];
    // `nearest` keeps the page itself from scrolling up or down.
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  return (
    <div className="relative">
      <Link
        href={href}
        className="group block rounded-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-burgundy"
      >
        <div
          ref={trackRef}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-brand bg-leather"
        >
          {images.map((image, index) => (
            <div key={image.url} className="relative w-full shrink-0 snap-start snap-always">
              <Image
                src={image.url}
                alt={altText(image, name, locale)}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
                // Only the first photo is needed right away.
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </Link>

      {children}

      {/* Bullets: small dots, each with a taller tap area (the `after:` layer). */}
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/25 px-1.5 py-1 backdrop-blur-sm">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                aria-label={t("home.products.photoOf", { n: index + 1, total: images.length })}
                aria-current={index === current}
                onClick={() => goTo(index)}
                className="relative flex h-2 cursor-pointer items-center after:absolute after:-inset-x-1 after:-inset-y-4 after:content-['']"
              >
                <span
                  className={`block h-1.5 rounded-full bg-ivory transition-all duration-300 ${
                    index === current ? "w-4" : "w-1.5 opacity-60"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function altText(image: CardImage, name: string, locale: Locale): string {
  return localized(image, "alt", locale) || name;
}
