import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { getFilterOptions, getProductBySlug, listProducts } from "@/lib/catalog/products";
import type { FilterOptions, ProductDetail, ProductFilters, ProductPage } from "@/lib/catalog/types";
import { api } from "./api";

/**
 * RTK Query hooks for the catalog. They call Supabase directly (see lib/catalog),
 * so they work on GitHub Pages too, and results are cached per filter set.
 *
 *   const { data, isLoading } = useListProductsQuery({ category: "dresses", page: 1 });
 *   const { data: product } = useGetProductQuery("layla-maxi-dress");
 */
// Same error shape as the base API, so components handle every error the same way.
function toError(error: unknown): FetchBaseQueryError {
  const e = (error ?? {}) as { message?: string; code?: string };
  return { status: "CUSTOM_ERROR", error: e.message ?? String(error), data: { code: e.code } };
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listProducts: build.query<ProductPage, ProductFilters>({
      async queryFn(filters) {
        try {
          return { data: await listProducts(filters) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
    }),
    getProduct: build.query<ProductDetail | null, string>({
      async queryFn(slug) {
        try {
          return { data: await getProductBySlug(slug) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
    }),
    getFilterOptions: build.query<FilterOptions, void>({
      async queryFn() {
        try {
          return { data: await getFilterOptions() };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      // Categories, colors and sizes rarely change.
      keepUnusedDataFor: 60 * 30,
    }),
  }),
});

export const { useListProductsQuery, useGetProductQuery, useGetFilterOptionsQuery } = productsApi;
