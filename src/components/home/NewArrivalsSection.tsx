import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useListProductsQuery } from "@/store/services/products";

const PRODUCT_COUNT = 8;

// Homepage section under the hero: the newest products, from Supabase.
// The data comes from the products API (useListProductsQuery → lib/catalog → Supabase),
// in the browser, so it works on the real server and on GitHub Pages.
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
          <p className="text-[11px] tracking-[0.32em] text-ink-muted uppercase md:text-xs rtl:text-[13px] rtl:tracking-normal">
            {t("home.products.eyebrow")}
          </p>
          <h2 id="new-arrivals-title" className="mt-2 font-display text-[30px] leading-[1.12] ltr:italic md:text-[44px] rtl:leading-[1.3] rtl:font-medium">
            {t("home.products.title")}
          </h2>
        </div>
        <Link
          href={localePath(locale, "/products")}
          className="flex min-h-11 shrink-0 items-center border-b border-ink/30 text-xs tracking-[0.2em] uppercase hover:border-ink rtl:text-sm rtl:tracking-normal"
        >
          {t("home.products.viewAll")}
        </Link>
      </div>

      {isLoading && <ProductGridSkeleton />}

      {isError && (
        <div className="grid justify-items-center gap-4 py-10 text-center">
          <p className="text-ink-muted">{t("home.products.error")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-11 rounded-brand border border-ink/30 px-6 text-xs tracking-[0.2em] uppercase hover:border-ink rtl:text-sm rtl:tracking-normal"
          >
            {t("home.products.retry")}
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="py-10 text-center text-ink-muted">{t("home.products.empty")}</p>
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
