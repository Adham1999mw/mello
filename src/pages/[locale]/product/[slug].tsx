import type { GetStaticPaths, GetStaticProps } from "next";
import ProductPage from "@/components/product/ProductPage";
import { locales, type Locale } from "@/i18n/config";
import { createBuildClient } from "@/lib/supabase/build";

// /ar/product/layla-maxi-dress/ and /en/product/layla-maxi-dress/ (optional ?color=black).
//
// Everything about the product is loaded in the browser (ProductPage → RTK Query → Supabase).
// The two functions below never fetch product data; they only tell Next which pages exist:
// - getStaticProps passes the locale and slug from the URL (the locale sets lang/dir and the
//   texts in the HTML, so Arabic doesn't flash as English first).
// - getStaticPaths:
//   - Real server: lists nothing at build. A product's page is made on its first visit
//     (fallback "blocking") and kept. A slug that doesn't exist shows "not found" in the page.
//   - GitHub Pages (STATIC_EXPORT): static files can't be made on a visit, so the build asks
//     Supabase once for the active slugs and makes one page per product. A product added
//     later needs a new deploy (Actions → Deploy to GitHub Pages → Run workflow).
const isStaticExport = process.env.STATIC_EXPORT === "true";

type Params = { locale: Locale; slug: string };
type Props = { locale: Locale; slug: string };

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  if (!isStaticExport) return { paths: [], fallback: "blocking" };

  const supabase = createBuildClient();
  const { data, error } = supabase
    ? await supabase.from("products").select("slug").eq("is_active", true)
    : { data: [], error: null };
  if (error) throw error;
  return {
    paths: locales.flatMap((locale) => (data ?? []).map((p) => ({ params: { locale, slug: p.slug } }))),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
  const { locale, slug } = params!;
  if (!locales.includes(locale)) return { notFound: true };
  return { props: { locale, slug } };
};

export default function ProductRoute({ slug }: Props) {
  return <ProductPage slug={slug} />;
}
