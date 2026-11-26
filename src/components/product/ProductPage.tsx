import { useState } from "react";
import Seo from "@/components/seo/Seo";
import { DiscountBadge, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { defaultColor, galleryImages, localized } from "@/lib/catalog/products";
import type { ProductDetail } from "@/lib/catalog/types";
import { formatPrice } from "./formatPrice";
import ProductGallery from "./ProductGallery";

/**
 * Product page (/ar/product/layla-maxi-dress/, optional ?color=black). The product comes
 * from the server (getServerSideProps in pages/[locale]/product/[slug].tsx).
 *
 * Built step by step. Now: photos (ProductGallery), name and price.
 * Next: color and size, add to bag, details tabs, reviews.
 */
export default function ProductPage({ product, wantedColor }: { product: ProductDetail; wantedColor: string | null }) {
  const { t, locale } = useTranslation();
  // The color picker (next step) will change this.
  const [color] = useState(() => defaultColor(product, wantedColor));

  const name = localized(product, "name", locale);
  const images = galleryImages(product, color);
  const variants = product.variants.filter((v) => v.color.slug === color);
  const prices = (variants.length ? variants : product.variants).map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : product.min_price;
  const maxPrice = prices.length ? Math.max(...prices) : product.max_price;
  const oldPrice = Math.max(0, ...variants.map((v) => v.compare_at_price ?? 0)) || null;
  const inStock = variants.some((v) => v.stock > 0);
  const discount = oldPrice && oldPrice > minPrice ? Math.round(((oldPrice - minPrice) / oldPrice) * 100) : 0;
  const category = product.category ? localized(product.category, "name", locale) : null;
  const description = localized(product, "description", locale);

  return (
    <>
      <Seo
        title={name}
        description={description || undefined}
        type="product"
        image={images[0] ? { url: images[0].url, alt: name } : undefined}
      />

      <div className="md:mx-auto md:grid md:max-w-[1184px] md:grid-cols-[minmax(0,1fr)_400px] md:items-start md:gap-[72px] md:px-8 md:pt-6 md:pb-24 xl:px-0">
        <ProductGallery images={images} name={name} priority>
          {inStock && discount >= 1 && <DiscountBadge percent={discount} className="absolute start-4 top-4 z-10" />}
        </ProductGallery>

        <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-7 md:sticky md:top-28 md:px-0 md:pt-1.5">
          {category && (
            <Typography variant="eyebrow" color="muted">
              {category}
            </Typography>
          )}
          <Typography variant="h1" color="burgundy">
            {name}
          </Typography>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Typography variant="h3" as="p" color="burgundy">
              {minPrice === maxPrice
                ? formatPrice(minPrice, locale)
                : t("product.page.fromPrice", { price: formatPrice(minPrice, locale) })}
            </Typography>
            {oldPrice && oldPrice > minPrice && (
              <Typography variant="price" as="s" color="muted">
                {formatPrice(oldPrice, locale)}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
