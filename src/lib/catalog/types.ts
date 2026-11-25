import type { Locale } from "@/i18n/config";

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

export type FilterOptions = {
  categories: CatalogCategory[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
};
