import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Base RTK Query API. Feature endpoints (products, cart, orders, ...) should be
 * added later with `api.injectEndpoints({ ... })` from their own files.
 * Requests go to this app's own Next.js route handlers under `/api`.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [],
  endpoints: () => ({}),
});
