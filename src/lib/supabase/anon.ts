import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Supabase client for public data on the server (getServerSideProps, getStaticProps, API routes):
// anon key, no login, no cookies. Because it never reads or sets cookies, a page that only uses
// this client can be cached by the CDN (see pages/[locale]/product/[slug].tsx).
// For the signed-in user's data, use ./server.ts instead.
export function createAnonClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
