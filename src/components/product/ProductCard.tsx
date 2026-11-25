import { useState } from "react";
import Link from "next/link";
import { colorView, localized } from "@/lib/catalog/products";
import type { ProductCard as ProductCardData } from "@/lib/catalog/types";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { formatPrice } from "./formatPrice";
import ProductImageSlider from "./ProductImageSlider";

// One product in a grid: swipeable photos, name, price, colors and sizes.
// It opens on the product's default color; tapping another color shows that color's
// photos, price, sale price, stock and sizes (all data comes with the card, no new request).
// Phone first: the grid around it decides the width (2 per row on phones).
export default function ProductCard({ product }: { product: ProductCardData }) {
  const { t, locale } = useTranslation();
  const [pickedColor, setPickedColor] = useState(product.default_color_slug);

  const view = colorView(product, pickedColor);
  const name = localized(product, "name", locale);

  // Fall back to the product-level data if it has no variants yet.
  const images =
    view && view.images.length > 0
      ? view.images
      : product.cover_url
        ? [{ url: product.cover_url, alt_ar: product.cover_alt_ar, alt_en: product.cover_alt_en, color_slug: null }]
        : [];
  const minPrice = view?.min_price ?? product.min_price;
  const maxPrice = view?.max_price ?? product.max_price;
  const oldPrice = view ? view.compare_at_price : product.compare_at_price;
  const inStock = view ? view.in_stock : product.in_stock;

  // One price, or "From 900 EGP" when this color's sizes have different prices.
  const price =
    minPrice === maxPrice
      ? formatPrice(minPrice, locale)
      : t("home.products.fromPrice", { price: formatPrice(minPrice, locale) });

  // The product page opens on the color picked here.
  const href = localePath(locale, `/products/${product.slug}${view ? `?color=${view.color.slug}` : ""}`);

  return (
    <article>
      {/* `key`: picking another color starts its photos from the first one. */}
      <ProductImageSlider key={view?.color.slug ?? "all"} images={images} name={name} href={href}>
        {!inStock && (
          <span className="pointer-events-none absolute start-2 top-2 rounded-brand bg-ivory/90 px-2 py-1 text-[10px] tracking-[0.14em] text-ink uppercase rtl:text-xs rtl:tracking-normal">
            {t("home.products.soldOut")}
          </span>
        )}
      </ProductImageSlider>

      <Link href={href} className="mt-3 block rounded-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy">
        <h3 className="line-clamp-1 text-sm text-ink md:text-base">{name}</h3>
      </Link>

      <p className="mt-1 text-sm text-ink-muted">
        {price}
        {oldPrice != null && oldPrice > minPrice && (
          <s className="ms-2 text-xs opacity-70">{formatPrice(oldPrice, locale)}</s>
        )}
      </p>

      {/* Colors: tap to switch the card to that color. Each dot is small, but its tap area
          is 44px (the `after:` layer), so it is easy to hit with a thumb. */}
      {product.colors.length > 1 && (
        <div role="group" aria-label={t("home.products.colors")} className="mt-2 flex gap-2">
          {product.colors.map((color) => {
            const picked = color.slug === view?.color.slug;
            return (
              <button
                key={color.slug}
                type="button"
                aria-pressed={picked}
                aria-label={localized(color, "name", locale)}
                title={localized(color, "name", locale)}
                onClick={() => setPickedColor(color.slug)}
                className={`relative size-5 cursor-pointer rounded-full ring-offset-2 ring-offset-ivory after:absolute after:-inset-3 after:content-['']
                            focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-burgundy
                            ${picked ? "ring-1 ring-ink" : "ring-1 ring-ink/15"}`}
                // The color comes from the product data, so it is set inline.
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      )}

      {/* Sizes of the picked color. Sold-out sizes are struck through. */}
      {view && view.sizes.length > 0 && (
        <ul aria-label={t("home.products.sizes")} className="mt-2 flex flex-wrap gap-x-2 text-[11px] text-ink-muted">
          {view.sizes.map(({ size, in_stock }) => (
            <li key={size.code} className={in_stock ? "" : "line-through opacity-50"}>
              {localized(size, "name", locale)}
              {!in_stock && <span className="sr-only"> ({t("home.products.soldOut")})</span>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
