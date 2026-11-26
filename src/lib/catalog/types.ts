import type { Locale } from "@/i18n/config";
import type { CareIcon, ReviewSort, ReviewStatus } from "@/lib/supabase/database.types";

export type { CareIcon, ReviewSort, ReviewStatus };

/** A color as shown in filters and swatches. */
export type CatalogColor = {
  slug: string;
  hex: string;
  name_ar: string;
  name_en: string;
};

export type CatalogSize = {
  code: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
};

export type CatalogCategory = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  parent_id: number | null;
};

/** Sort options for the product list. */
export const PRODUCT_SORTS = ["newest", "price_asc", "price_desc", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Every filter is optional; leave it out to not filter by it. */
export type ProductFilters = {
  /** Category slug, e.g. "dresses". Includes its child categories. */
  category?: string;
  /** Color slugs, e.g. ["black", "burgundy"]. Matches any of them. */
  colors?: string[];
  /** Size codes, e.g. ["M", "L"]. Matches any of them. */
  sizes?: string[];
  /** EGP */
  minPrice?: number;
  /** EGP */
  maxPrice?: number;
  /** Only products that have the chosen color/size in stock. */
  inStock?: boolean;
  /** Text search in the Arabic and English names. */
  search?: string;
  featured?: boolean;
  sort?: ProductSort;
  /** 1-based page number. Default 1. */
  page?: number;
  /** Products per page. Default 12, max 48. */
  pageSize?: number;
  /** Used by sort "name" to sort by the right language. Default "ar". */
  locale?: Locale;
};

/** One color x size of a product, as sent with a product card. */
export type CardVariant = {
  id: number;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  color_slug: string;
  size_code: string;
};

/** A product photo. `color_slug` is null when it shows every color. */
export type CardImage = {
  url: string;
  alt_ar: string | null;
  alt_en: string | null;
  color_slug: string | null;
};

/** How an image sits in its frame: "contain" shows all of it, "cover" fills the frame. */
export type ImageFit = "cover" | "contain";

/** One product card in a list. */
export type ProductCard = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  category_slug: string | null;
  is_featured: boolean;
  /** Lowest variant price, EGP. */
  min_price: number;
  max_price: number;
  /** Old price (before sale), if any. */
  compare_at_price: number | null;
  in_stock: boolean;
  cover_url: string | null;
  cover_alt_ar: string | null;
  cover_alt_en: string | null;
  colors: CatalogColor[];
  size_codes: string[];
  /** Every color x size, ordered by color then size. */
  variants: CardVariant[];
  /** Every photo, in display order. */
  images: CardImage[];
  /** Sizes it comes in, S → XL. */
  sizes: CatalogSize[];
  /** The color to show first (cover color if in stock, else the first color in stock). */
  default_color_slug: string | null;
  /** The first in-stock size of that color. */
  default_variant_id: number | null;
  /** The special lookbook image (full URL), or null to use the cover photo. */
  feature_image_url: string | null;
  feature_image_alt_ar: string | null;
  feature_image_alt_en: string | null;
  /** "contain" for cutouts (whole figure in view), "cover" to fill the frame. */
  feature_image_fit: ImageFit;
};

/** What a card shows for one picked color (see `colorView`). */
export type ColorView = {
  color: CatalogColor;
  /** That color's photos (or the shared ones if it has none). */
  images: CardImage[];
  min_price: number;
  max_price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  /** Each size of that color, and whether it can be bought. */
  sizes: { size: CatalogSize; variant: CardVariant | undefined; in_stock: boolean }[];
};

export type ProductPage = {
  items: ProductCard[];
  /** Products matching the filters, on all pages. */
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** One color x size option of a product. */
export type ProductVariant = {
  id: number;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  color: CatalogColor;
  size: CatalogSize;
};

export type ProductImage = {
  id: number;
  url: string;
  alt_ar: string | null;
  alt_en: string | null;
  /** Set when the photo shows one color only. */
  color_slug: string | null;
};

/** A full product page. */
export type ProductDetail = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  is_featured: boolean;
  /** "Fabric & care" tab. Every field is optional. */
  specs: ProductSpecs;
  category: CatalogCategory | null;
  images: ProductImage[];
  variants: ProductVariant[];
  /** Colors this product comes in (for the color picker). */
  colors: CatalogColor[];
  /** Sizes this product comes in, S → XL order (for the size picker). */
  sizes: CatalogSize[];
  min_price: number;
  max_price: number;
  in_stock: boolean;
};

/** Fabric, care and fit details of one product (all optional). */
export type ProductSpecs = {
  fabric_ar: string | null;
  fabric_en: string | null;
  /** g/m² */
  fabric_weight_gsm: number | null;
  origin_ar: string | null;
  origin_en: string | null;
  care_ar: string | null;
  care_en: string | null;
  care_icons: CareIcon[];
  /** "The model is 170 cm and wears S" */
  model_height_cm: number | null;
  model_size_code: string | null;
  /** Extra delivery note for this product only, shown under the store's delivery text. */
  delivery_note_ar: string | null;
  delivery_note_en: string | null;
};

/** Delivery & returns, shared by every product page (table store_settings). */
export type StoreSettings = {
  delivery_ar: string;
  delivery_en: string;
  /** EGP; null = no free delivery */
  free_shipping_threshold: number | null;
  cairo_days_min: number;
  cairo_days_max: number;
  other_days_min: number;
  other_days_max: number;
  exchange_days: number;
  cod_enabled: boolean;
};

/** Review summary of one product (approved reviews only). */
export type ReviewStats = {
  review_count: number;
  /** 0 when there are no reviews, else 1.0 to 5.0 */
  avg_rating: number;
  /** How many reviews gave 5, 4, 3, 2 and 1 stars: counts[0] = 5 stars. */
  counts: [number, number, number, number, number];
  verified_count: number;
};

/** One public review. */
export type Review = {
  id: number;
  /** Null when the customer has no name in her profile. */
  display_name: string | null;
  rating: number;
  body: string;
  is_verified: boolean;
  created_at: string;
};

export type ReviewPage = {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ReviewQuery = {
  slug: string;
  sort?: ReviewSort;
  /** 1-based. Default 1. */
  page?: number;
  /** Default 3 (the product page), max 50. */
  pageSize?: number;
};

/** The signed-in customer's own review of a product, in any status. */
export type MyReview = {
  id: number;
  rating: number;
  body: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

export type FilterOptions = {
  categories: CatalogCategory[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
};

/**
 * One item in the homepage lookbook: a product with `is_featured` on, made from its
 * product card by `toLookbookItem` (lib/catalog/products.ts).
 */
export type LookbookItem = {
  id: number;
  /** Product slug: the details button opens `/products/{slug}`. */
  slug: string;
  name_ar: string;
  name_en: string;
  /** EGP */
  price: number;
  /** Old price (before sale), if any. */
  compare_at_price: number | null;
  in_stock: boolean;
  /** Full URL from storage, or a `/public` path starting with "/". */
  image_url: string;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  /** "contain" for cutouts on a transparent background (whole figure in view). Default "cover". */
  image_fit: ImageFit;
};
