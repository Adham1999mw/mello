import { useState } from "react";
import { useRouter } from "next/router";
import Seo from "@/components/seo/Seo";
import { Button, DiscountBadge, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { defaultColor, galleryImages, localized } from "@/lib/catalog/products";
import type { ProductDetail } from "@/lib/catalog/types";
import { useGetProductQuery } from "@/store/services/products";
import { formatPrice } from "./formatPrice";
import ProductGallery from "./ProductGallery";

/**
 * Product page (/ar/product/layla-maxi-dress/, optional ?color=black). The route
 * (pages/[locale]/product/[slug].tsx) gives the slug; the product is fetched in the
 * browser (RTK Query → Supabase), so price and stock are always fresh.
 *
 * Built step by step. Now: photos (ProductGallery), name and price.
 * Next: color and size, add to bag, details tabs, reviews.
 */
export default function ProductPage({ slug }: { slug: string }) {
  const { query, isReady } = useRouter();
  const color = typeof query.color === "string" ? query.color : null;
  const { data: product, isLoading, isError, refetch } = useGetProductQuery(slug, { skip: !slug });

  if (!isReady || isLoading) return <ProductSkeleton />;
  if (isError) return <LoadError onRetry={refetch} />;
  if (!slug || !product) return <NotFound />;
  // `key`: another product (or color link) starts fresh.
  return <ProductView key={`${product.slug}-${color ?? ""}`} product={product} wantedColor={color} />;
}

function ProductView({ product, wantedColor }: { product: ProductDetail; wantedColor: string | null }) {
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

function ProductSkeleton() {
  return (
    <div
      className="animate-pulse md:mx-auto md:grid md:max-w-[1184px] md:grid-cols-[minmax(0,1fr)_400px] md:gap-[72px] md:px-8 md:pt-6 xl:px-0"
      aria-busy="true"
    >
      <div className="aspect-[2/3] w-full bg-leather md:ms-[102px] md:w-auto md:rounded-brand" />
      <div className="flex flex-col gap-3 px-4 pt-5 md:px-0">
        <div className="h-3 w-24 rounded-brand bg-leather" />
        <div className="h-9 w-3/4 rounded-brand bg-leather" />
        <div className="h-7 w-28 rounded-brand bg-leather" />
      </div>
    </div>
  );
}

function NotFound() {
  const { t, locale } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Seo title={t("product.page.notFoundTitle")} noindex />
      <Typography variant="h1" color="burgundy">
        {t("product.page.notFoundTitle")}
      </Typography>
      <Typography color="muted">{t("product.page.notFoundBody")}</Typography>
      <Button href={localePath(locale)} fullWidth="mobile">
        {t("product.page.backToShop")}
      </Button>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Typography color="muted">{t("product.page.error")}</Typography>
      <Button variant="outline" fullWidth="mobile" onClick={onRetry}>
        {t("product.page.retry")}
      </Button>
    </div>
  );
}
