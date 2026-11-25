import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Base RTK Query API. Feature endpoints (products, cart, orders, ...) should be
 * added later with `api.injectEndpoints({ ... })` from their own files.
 * `baseQuery` targets this app's `/api` routes (real server only). Endpoints that must
 * also work on GitHub Pages use `queryFn` with Supabase instead (see ./products.ts).
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [],
  endpoints: () => ({}),
});
