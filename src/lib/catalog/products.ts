import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { Database, Views } from "@/lib/supabase/database.types";
import type {
  CardImage,
  CardVariant,
  CatalogColor,
  CatalogSize,
  ColorView,
  FilterOptions,
  ImageFit,
  LookbookItem,
  ProductCard,
  ProductDetail,
  ProductFilters,
  ProductImage,
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
export type Client = SupabaseClient<Database>;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

/** Bucket for product photos (created by the migration). */
const IMAGE_BUCKET = "product-images";

let browserClient: Client | undefined;
/** The shared browser client, or the one passed in (server pages). */
export function getClient(client?: Client): Client {
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
    variants: ((row.variants as CardVariant[] | null) ?? []).map((v) => ({
      ...v,
      price: Number(v.price),
      compare_at_price: v.compare_at_price == null ? null : Number(v.compare_at_price),
    })),
    images: ((row.images as CardImage[] | null) ?? []).map((img) => ({
      ...img,
      url: productImageUrl(img.url)!,
    })),
    sizes: (row.sizes as CatalogSize[] | null) ?? [],
    default_color_slug: row.default_color_slug,
    default_variant_id: row.default_variant_id,
    feature_image_url: productImageUrl(row.feature_image_url ?? null),
    feature_image_alt_ar: row.feature_image_alt_ar ?? null,
    feature_image_alt_en: row.feature_image_alt_en ?? null,
    feature_image_fit: (row.feature_image_fit as ImageFit | null) ?? "contain",
  };
}

/**
 * A featured product as a lookbook item: its special image, or its cover photo
 * (filling the frame) when it has none. Products with no photo at all return null.
 *   const looks = page.items.map(toLookbookItem).filter((item) => item !== null);
 */
export function toLookbookItem(card: ProductCard): LookbookItem | null {
  const special = card.feature_image_url;
  const image_url = special ?? card.cover_url;
  if (!image_url) return null;
  return {
    id: card.id,
    slug: card.slug,
    name_ar: card.name_ar,
    name_en: card.name_en,
    price: card.min_price,
    compare_at_price: card.compare_at_price,
    in_stock: card.in_stock,
    image_url,
    image_alt_ar: special ? card.feature_image_alt_ar : card.cover_alt_ar,
    image_alt_en: special ? card.feature_image_alt_en : card.cover_alt_en,
    image_fit: special ? card.feature_image_fit : "cover",
  };
}

/**
 * Everything a card shows for one color: its photos, price range, stock and sizes.
 *   const view = colorView(product, pickedColor ?? product.default_color_slug);
 */
export function colorView(product: ProductCard, colorSlug: string | null): ColorView | null {
  const color = product.colors.find((c) => c.slug === colorSlug) ?? product.colors[0];
  // No variants sent (database without 20261125010000_listing_variants.sql): the card
  // falls back to the product-level price, stock and cover photo.
  if (!color || product.variants.length === 0) return null;

  const variants = product.variants.filter((v) => v.color_slug === color.slug);
  const prices = variants.map((v) => v.price);
  const oldPrices = variants.map((v) => v.compare_at_price).filter((p): p is number => p != null);
  const ownImages = product.images.filter((img) => img.color_slug === color.slug);
  const sharedImages = product.images.filter((img) => img.color_slug == null);

  return {
    color,
    images: ownImages.length > 0 ? ownImages : sharedImages,
    min_price: prices.length ? Math.min(...prices) : product.min_price,
    max_price: prices.length ? Math.max(...prices) : product.max_price,
    compare_at_price: oldPrices.length ? Math.max(...oldPrices) : null,
    in_stock: variants.some((v) => v.stock > 0),
    sizes: product.sizes.map((size) => {
      const variant = variants.find((v) => v.size_code === size.code);
      return { size, variant, in_stock: (variant?.stock ?? 0) > 0 };
    }),
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
       fabric_ar, fabric_en, fabric_weight_gsm, origin_ar, origin_en, care_ar, care_en,
       care_icons, model_height_cm, model_size_code, delivery_note_ar, delivery_note_en,
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
    specs: {
      fabric_ar: data.fabric_ar,
      fabric_en: data.fabric_en,
      fabric_weight_gsm: data.fabric_weight_gsm,
      origin_ar: data.origin_ar,
      origin_en: data.origin_en,
      care_ar: data.care_ar,
      care_en: data.care_en,
      care_icons: data.care_icons ?? [],
      model_height_cm: data.model_height_cm,
      model_size_code: data.model_size_code,
      delivery_note_ar: data.delivery_note_ar,
      delivery_note_en: data.delivery_note_en,
    },
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

/**
 * Link to a product page, without the locale (wrap it in `localePath`):
 *   localePath(locale, productPath("layla-maxi-dress"))          -> "/ar/product/layla-maxi-dress/"
 *   localePath(locale, productPath("layla-maxi-dress", "black")) -> "/ar/product/layla-maxi-dress/?color=black"
 */
export function productPath(slug: string, colorSlug?: string | null): string {
  const path = `/product/${encodeURIComponent(slug)}`;
  return colorSlug ? `${path}?color=${encodeURIComponent(colorSlug)}` : path;
}

/**
 * Photos for the picked color: that color's photos plus the ones shared by every color,
 * in display order. A color without photos of its own shows all of them.
 */
export function galleryImages(product: ProductDetail, colorSlug: string | null): ProductImage[] {
  if (!colorSlug) return product.images;
  const own = product.images.filter((img) => img.color_slug === colorSlug);
  if (own.length === 0) return product.images;
  return product.images.filter((img) => img.color_slug === colorSlug || img.color_slug === null);
}

/** The color to open on: the one asked for if sold, else the first color in stock, else the first. */
export function defaultColor(product: ProductDetail, wanted?: string | null): string | null {
  if (wanted && product.colors.some((c) => c.slug === wanted)) return wanted;
  const inStock = product.variants.find((v) => v.stock > 0);
  return inStock?.color.slug ?? product.colors[0]?.slug ?? null;
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
