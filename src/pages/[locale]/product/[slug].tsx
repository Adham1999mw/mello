import type { GetServerSideProps } from "next";
import ProductPage from "@/components/product/ProductPage";
import { locales, type Locale } from "@/i18n/config";
import { getProductBySlug } from "@/lib/catalog/products";
import type { ProductDetail } from "@/lib/catalog/types";
import { createAnonClient } from "@/lib/supabase/anon";

// /ar/product/layla-maxi-dress/ and /en/product/layla-maxi-dress/ (optional ?color=black).
//
// The product is loaded on the server for every request, so the HTML already has the name,
// photos and price (good for Google and link previews), and a new product works right away.
// A slug that doesn't exist (or a hidden product) gets a real 404.
//
// Cost: Vercel's CDN keeps the page for 60 seconds (s-maxage), then serves the old copy while
// it refreshes in the background (stale-while-revalidate). So a busy product page calls
// Supabase about once a minute, not on every visit. Price and stock can be up to a minute old;
// the bag checks stock again before checkout.
type Params = { locale: Locale; slug: string };
type Props = { locale: Locale; product: ProductDetail; color: string | null };

export const getServerSideProps: GetServerSideProps<Props, Params> = async ({ params, query, res }) => {
  const { locale, slug } = params!;
  if (!locales.includes(locale)) return { notFound: true };

  const product = await getProductBySlug(slug, createAnonClient());
  if (!product) return { notFound: true };

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  const color = typeof query.color === "string" ? query.color : null;
  return { props: { locale, product, color } };
};

export default function ProductRoute({ product, color }: Props) {
  // `key`: opening another product (or color link) starts the page fresh.
  return <ProductPage key={`${product.slug}-${color ?? ""}`} product={product} wantedColor={color} />;
}
