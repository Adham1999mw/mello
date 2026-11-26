import ProductCard from "@/components/product/ProductCard";
import { Button, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useListProductsQuery } from "@/store/services/products";

const PRODUCT_COUNT = 8;

// Homepage section under the hero: the newest products, from Supabase.
// The data comes from the products API (useListProductsQuery → lib/catalog → Supabase),
// in the browser (RTK Query → Supabase).
export default function NewArrivalsSection() {
  const { t, locale } = useTranslation();
  const { data, isLoading, isError, refetch } = useListProductsQuery({
    sort: "newest",
    pageSize: PRODUCT_COUNT,
    locale,
  });

  return (
    <section aria-labelledby="new-arrivals-title" className="bg-ivory px-5 py-14 text-ink md:px-14 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
        <div>
          <Typography variant="eyebrow" color="muted">
            {t("home.products.eyebrow")}
          </Typography>
          <Typography variant="h1" as="h2" italic id="new-arrivals-title" className="mt-2">
            {t("home.products.title")}
          </Typography>
        </div>
        <Button href={localePath(locale, "/products")} variant="link" tone="ink">
          {t("home.products.viewAll")}
        </Button>
      </div>

      {isLoading && <ProductGridSkeleton />}

      {isError && (
        <div className="grid justify-items-center gap-4 py-10 text-center">
          <Typography color="muted">{t("home.products.error")}</Typography>
          <Button variant="outline" tone="ink" size="sm" onClick={() => refetch()}>
            {t("home.products.retry")}
          </Button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <Typography color="muted" className="py-10 text-center">
          {t("home.products.empty")}
        </Typography>
      )}

      {data && data.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12">
          {data.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Grey placeholder cards while the products load, in the same grid as the real ones.
function ProductGridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12">
      {Array.from({ length: PRODUCT_COUNT }, (_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-brand bg-leather" />
          <div className="mt-3 h-4 w-3/4 rounded-brand bg-leather" />
          <div className="mt-2 h-4 w-1/3 rounded-brand bg-leather" />
        </li>
      ))}
    </ul>
  );
}
