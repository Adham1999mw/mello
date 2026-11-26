import type { NextConfig } from "next";

// Hosted on Vercel (a real Node server): getServerSideProps, API routes (`pages/api`),
// the proxy (src/proxy.ts), Supabase on the server and image optimization all work.
// URLs: `/` and `/en/` (English), `/ar/` (Arabic), from `src/pages/[locale]/`.

// Supabase proxy: the browser calls `/supabase/...` on our own domain and Next forwards it to
// the Supabase project, e.g.
//   /supabase/rest/v1/rpc/search_products -> https://<ref>.supabase.co/rest/v1/rpc/search_products
// So the Supabase URL stays out of the browser's network tab and there is no CORS.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_PROXY_PATH = "/supabase";
const useSupabaseProxy = !!supabaseUrl;

// Say clearly when Supabase isn't set up, instead of every product request failing with a 500.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
if (!supabaseUrl || supabaseUrl.includes("your-project-ref") || !supabaseKey || supabaseKey.startsWith("your-")) {
  console.warn(
    "\n⚠ Supabase is not set up: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n" +
      "  are missing or still the examples, so product requests will fail.\n" +
      "  Put your project's values there (docs/supabase-setup.md, step 3) and restart the dev server.\n",
  );
}

const nextConfig: NextConfig = {
  env: {
    // Read by src/lib/supabase/client.ts; empty = call Supabase directly.
    NEXT_PUBLIC_SUPABASE_PROXY_PATH: useSupabaseProxy ? SUPABASE_PROXY_PATH : "",
  },
  // Every URL ends with "/" (/en/product/x/). Kept so links already shared keep working.
  trailingSlash: true,
  // Next would redirect `/supabase/rest/v1/rpc/search_products` to `.../search_products/`,
  // which Supabase doesn't know. Turn that redirect off so the proxy forwards exact paths.
  skipTrailingSlashRedirect: useSupabaseProxy,
  images: {
    // Product photos: Supabase Storage, and placehold.co for the sample data in supabase/seed.sql.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.postimg.cc" },
    ],
  },
  ...(useSupabaseProxy && {
    async rewrites() {
      return [{ source: `${SUPABASE_PROXY_PATH}/:path*`, destination: `${supabaseUrl}/:path*` }];
    },
  }),
  // Bundle Emotion + MUI's Next.js adapter together with MUI so they share one
  // @emotion/react instance on the server. Without this, Turbopack loads a second
  // copy and MUI ignores the RTL / CSS-layer Emotion cache during SSR.
  transpilePackages: ["@emotion/react", "@emotion/styled", "@emotion/cache", "@mui/material-nextjs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
