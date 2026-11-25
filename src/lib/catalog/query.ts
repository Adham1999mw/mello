import type { ParsedUrlQuery } from "querystring";
import { PRODUCT_SORTS, type ProductFilters, type ProductSort } from "./types";

/**
 * Keeps filters in the page URL, so a filtered list can be shared and the back
 * button works: /products/?category=dresses&color=black,burgundy&size=M&page=2
 *
 *   const filters = filtersFromQuery(router.query);
 *   router.push({ query: filtersToQuery({ ...filters, page: 1, sort: "price_asc" }) });
 */
export function filtersFromQuery(query: ParsedUrlQuery): ProductFilters {
  const one = (key: string) => {
    const value = query[key];
    return (Array.isArray(value) ? value[0] : value) || undefined;
  };
  const list = (key: string) => one(key)?.split(",").map((s) => s.trim()).filter(Boolean);
  const num = (key: string) => {
    const n = Number(one(key));
    return one(key) !== undefined && Number.isFinite(n) ? n : undefined;
  };
  const sort = one("sort");

  return {
    category: one("category"),
    colors: list("color"),
    sizes: list("size"),
    minPrice: num("min"),
    maxPrice: num("max"),
    inStock: one("in_stock") === "1" || undefined,
    search: one("q"),
    sort: PRODUCT_SORTS.includes(sort as ProductSort) ? (sort as ProductSort) : undefined,
    page: num("page"),
  };
}

export function filtersToQuery(filters: ProductFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.category) query.category = filters.category;
  if (filters.colors?.length) query.color = filters.colors.join(",");
  if (filters.sizes?.length) query.size = filters.sizes.join(",");
  if (filters.minPrice != null) query.min = String(filters.minPrice);
  if (filters.maxPrice != null) query.max = String(filters.maxPrice);
  if (filters.inStock) query.in_stock = "1";
  if (filters.search) query.q = filters.search;
  if (filters.sort && filters.sort !== "newest") query.sort = filters.sort;
  if (filters.page && filters.page > 1) query.page = String(filters.page);
  return query;
}
