import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Supabase client for getStaticPaths / getStaticProps: runs on the build machine (and, on the
// real server, when a new page is generated). Anon key only, no login, no cookies.
// Returns null when Supabase isn't set up, so the build still works (with no product pages).
export function createBuildClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-ref") || key.startsWith("your-")) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
