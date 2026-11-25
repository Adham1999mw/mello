import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Supabase client for Client Components (browser). Uses the public anon key only.
// Typed with `Database`, so `.from("products")` knows every column.
//
// On the real server, requests go through our own `/supabase` proxy (see `rewrites` in
// next.config.ts). On GitHub Pages there is no proxy, so it calls the Supabase URL directly.
export function createClient() {
  const proxyPath = process.env.NEXT_PUBLIC_SUPABASE_PROXY_PATH;
  const url = proxyPath ? `${window.location.origin}${proxyPath}` : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createBrowserClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
