import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { Database, Views } from "@/lib/supabase/database.types";
import type {
  CatalogColor,
  FilterOptions,
  ProductCard,
  ProductDetail,
  ProductFilters,
  ProductPage,
} from "./types";

/**
 * The products "API". There is no server on GitHub Pages, so the browser talks to
 * Supabase directly with the public anon key. Row Level Security (see
 * supabase/migrations) makes that safe: the anon key can only read active products.
 *
 *   const page = await listProducts({ category: "dresses", colors: ["black"], sizes: ["M"],
 *                                     inStock: true, sort: "price_asc", page: 2 });
 *   page.items   // 12 product cards
 *   page.total   // how many match, on all pages
 *
 * Every function takes an optional client, so server pages (`*.server.tsx`) can pass the
 * client from `@/lib/supabase/server` instead.
 */
type Client = SupabaseClient<Database>;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

/** Bucket for product photos (created by the migration). */
const IMAGE_BUCKET = "product-images";

let browserClient: Client | undefined;
function getClient(client?: Client): Client {
  if (client) return client;
  browserClient ??= createClient();
  return browserClient;
}

/** product_images.url can be a full URL or a path inside the Storage bucket. */
export function productImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${url.replace(/^\/+/, "")}`;
}

/** Picks the Arabic or English field: `localized(product, "name", locale)`. */
export function localized<K extends string>(
  item: { [P in `${K}_ar` | `${K}_en`]: string | null },
  key: K,
  locale: Locale,
): string {
  return (item[`${key}_${locale}` as `${K}_ar`] ?? item[`${key}_ar` as `${K}_ar`] ?? "") as string;
}

function clampPageSize(size: number | undefined): number {
  if (!size || !Number.isFinite(size) || size < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(size), MAX_PAGE_SIZE);
}

function toCard(row: Views<"product_listing">): ProductCard {
  return {
    id: row.id!,
    slug: row.slug!,
    name_ar: row.name_ar ?? "",
    name_en: row.name_en ?? "",
    category_slug: row.category_slug,
    is_featured: row.is_featured ?? false,
    min_price: Number(row.min_price ?? 0),
    max_price: Number(row.max_price ?? 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    in_stock: row.in_stock ?? false,
    cover_url: productImageUrl(row.cover_url),
    cover_alt_ar: row.cover_alt_ar,
    cover_alt_en: row.cover_alt_en,
    colors: (row.colors as CatalogColor[] | null) ?? [],
    size_codes: row.size_codes ?? [],
  };
}

/** Lists products with filters, sorting and pagination. */
export async function listProducts(
  filters: ProductFilters = {},
  client?: Client,
): Promise<ProductPage> {
  const supabase = getClient(client);
  const pageSize = clampPageSize(filters.pageSize);
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const nonEmpty = (list?: string[]) => (list && list.length > 0 ? list : undefined);
  const args: Database["public"]["Functions"]["search_products"]["Args"] = {
    category_slug: filters.category || undefined,
    colors: nonEmpty(filters.colors),
    sizes: nonEmpty(filters.sizes),
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    in_stock: filters.inStock || undefined,
    search: filters.search?.trim() || undefined,
    featured: filters.featured,
  };
  // Leave out unset filters so the function uses its defaults (null = no filter).
  const cleanArgs = Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== undefined),
  ) as typeof args;

  let query = supabase.rpc("search_products", cleanArgs, { count: "exact" });

  switch (filters.sort ?? "newest") {
    case "price_asc":
      query = query.order("min_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("min_price", { ascending: false });
      break;
    case "name":
      query = query.order(filters.locale === "en" ? "name_en" : "name_ar", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  // Tie-breaker keeps pages stable (no product shows up on two pages).
  query = query.order("id", { ascending: false });

  const { data, count, error } = await query.range(from, to);

  // Asking for a page after the last one: PostgREST answers "range not satisfiable".
  if (error?.code === "PGRST103") {
    const { count: total } = await supabase.rpc("search_products", cleanArgs, {
      count: "exact",
      head: true,
    });
    return emptyPage(page, pageSize, total ?? 0);
  }
  if (error) throw error;

  const total = count ?? 0;
  return {
    items: (data ?? []).map(toCard),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

function emptyPage(page: number, pageSize: number, total: number): ProductPage {
  return { items: [], total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

/** One product with its category, photos and every color x size variant. */
export async function getProductBySlug(
  slug: string,
  client?: Client,
): Promise<ProductDetail | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name_ar, name_en, description_ar, description_en, is_featured,
       category:categories ( id, slug, name_ar, name_en, parent_id ),
       images:product_images ( id, url, alt_ar, alt_en, sort_order, color:colors ( slug ) ),
       variants:product_variants (
         id, sku, price, compare_at_price, stock,
         color:colors ( slug, hex, name_ar, name_en, sort_order ),
         size:sizes ( code, name_ar, name_en, sort_order )
       )`,
    )
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "product_images" })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const colorOrder = new Map(data.variants.map((v) => [v.color.slug, v.color.sort_order]));
  const variants: ProductDetail["variants"] = data.variants
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      compare_at_price: v.compare_at_price == null ? null : Number(v.compare_at_price),
      stock: v.stock,
      color: { slug: v.color.slug, hex: v.color.hex, name_ar: v.color.name_ar, name_en: v.color.name_en },
      size: v.size,
    }))
    .sort(
      (a, b) =>
        colorOrder.get(a.color.slug)! - colorOrder.get(b.color.slug)! ||
        a.size.sort_order - b.size.sort_order,
    );

  const colors = uniqueBy(variants.map((v) => v.color), (c) => c.slug);
  const sizes = uniqueBy(variants.map((v) => v.size), (s) => s.code).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const prices = variants.map((v) => v.price);

  return {
    id: data.id,
    slug: data.slug,
    name_ar: data.name_ar,
    name_en: data.name_en,
    description_ar: data.description_ar,
    description_en: data.description_en,
    is_featured: data.is_featured,
    category: data.category,
    images: data.images.map((img) => ({
      id: img.id,
      url: productImageUrl(img.url)!,
      alt_ar: img.alt_ar,
      alt_en: img.alt_en,
      color_slug: img.color?.slug ?? null,
    })),
    variants,
    colors,
    sizes,
    min_price: prices.length ? Math.min(...prices) : 0,
    max_price: prices.length ? Math.max(...prices) : 0,
    in_stock: variants.some((v) => v.stock > 0),
  };
}

/** The variant for a picked color + size, or undefined if that combination isn't sold. */
export function findVariant(product: ProductDetail, colorSlug: string, sizeCode: string) {
  return product.variants.find((v) => v.color.slug === colorSlug && v.size.code === sizeCode);
}

/** Categories, colors and sizes for the filter panel. */
export async function getFilterOptions(client?: Client): Promise<FilterOptions> {
  const supabase = getClient(client);
  const [categories, colors, sizes] = await Promise.all([
    supabase.from("categories").select("id, slug, name_ar, name_en, parent_id").order("sort_order"),
    supabase.from("colors").select("slug, hex, name_ar, name_en").order("sort_order"),
    supabase.from("sizes").select("code, name_ar, name_en, sort_order").order("sort_order"),
  ]);
  for (const result of [categories, colors, sizes]) if (result.error) throw result.error;
  return {
    categories: categories.data ?? [],
    colors: colors.data ?? [],
    sizes: sizes.data ?? [],
  };
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
