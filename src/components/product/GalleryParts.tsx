import Image from "next/image";
import { cn } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { formatNumber } from "./formatPrice";

// Pieces shared by ProductGallery and PhotoZoom.

/** A photo as the gallery needs it (ProductImage and CardImage both fit). */
export type GalleryImage = { url: string; alt_ar: string | null; alt_en: string | null };

/** Small photos to pick from. The current one is full strength with a burgundy ring. */
export function Thumbs({
  images,
  current,
  onPick,
  altOf,
  className,
  large = false,
  tone = "light",
}: {
  images: GalleryImage[];
  current: number;
  onPick: (index: number) => void;
  altOf: (img: GalleryImage) => string;
  className?: string;
  /** From md: 84×116 instead of 52×72 (page layout). */
  large?: boolean;
  /** "dark" on the burgundy zoom view. */
  tone?: "light" | "dark";
}) {
  const { t, locale } = useTranslation();
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)}>
      {images.map((img, i) => (
        <button
          key={img.url}
          type="button"
          onClick={() => onPick(i)}
          aria-current={i === current}
          aria-label={t("product.gallery.photoOf", {
            n: formatNumber(i + 1, locale),
            total: formatNumber(images.length, locale),
          })}
          className={cn(
            "relative h-[72px] w-[52px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] transition-opacity duration-200",
            large && "md:h-[116px] md:w-[84px] md:rounded-brand",
            i === current ? "opacity-100" : "opacity-55 hover:opacity-100",
            tone === "dark" ? "focus-visible:outline-champagne" : "focus-visible:outline-burgundy",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <Image src={img.url} alt={altOf(img)} fill sizes={large ? "(min-width: 768px) 84px, 52px" : "52px"} className="object-cover" />
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 rounded-[inherit]",
              i !== current
                ? "shadow-[inset_0_0_0_1px] shadow-ink/10"
                : tone === "dark"
                  ? "shadow-[inset_0_0_0_2px] shadow-champagne"
                  : "shadow-[inset_0_0_0_2px] shadow-burgundy",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Chevron that points back / forward in the reading direction (flips in Arabic). */
export function ArrowIcon({ direction }: { direction: "back" | "forward" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className={cn("rtl:-scale-x-100", direction === "forward" && "rotate-180")}
    >
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
