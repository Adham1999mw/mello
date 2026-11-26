import type { NextConfig } from "next";

// Two ways to build the same code:
//
// 1. Real server (default): `npm run build` + `npm start`. Everything works:
//    getServerSideProps, API routes (`pages/api`), Supabase on the server, image optimization.
//
// 2. GitHub Pages (static files, no server): the deploy workflow sets STATIC_EXPORT=true.
//    - API routes are skipped automatically.
//    - Pages that need the server are named `*.server.tsx` (e.g. `pages/[locale]/orders.server.tsx`)
//      and the workflow removes them before building, so they are not on GitHub Pages.
//    - The site lives under /<repo-name>, passed in as PAGES_BASE_PATH.
//
// Both modes use the same URLs: `/` and `/en/` (English), `/ar/` (Arabic), from `src/pages/[locale]/`.
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = isStaticExport ? process.env.PAGES_BASE_PATH || undefined : undefined;

// Supabase proxy (real server only): the browser calls `/supabase/...` on our own domain and
// Next forwards it to the Supabase project, e.g.
//   /supabase/rest/v1/rpc/search_products -> https://<ref>.supabase.co/rest/v1/rpc/search_products
// So the Supabase URL stays out of the browser's network tab and there is no CORS.
// GitHub Pages has no server to forward requests, so there the browser calls Supabase directly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_PROXY_PATH = "/supabase";
const useSupabaseProxy = !isStaticExport && !!supabaseUrl;

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
  output: isStaticExport ? "export" : undefined,
  basePath,
  // next/image and CSS `url()` don't add basePath on their own; `assetPath()` uses this.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
    // Read by src/lib/supabase/client.ts; empty = call Supabase directly.
    NEXT_PUBLIC_SUPABASE_PROXY_PATH: useSupabaseProxy ? SUPABASE_PROXY_PATH : "",
  },
  // `/en/` -> `en/index.html` on GitHub Pages; kept on the server too so URLs match.
  trailingSlash: true,
  // Next would redirect `/supabase/rest/v1/rpc/search_products` to `.../search_products/`,
  // which Supabase doesn't know. Turn that redirect off so the proxy forwards exact paths.
  skipTrailingSlashRedirect: useSupabaseProxy,
  images: {
    // GitHub Pages has no image optimization server; the real server does.
    unoptimized: isStaticExport,
    // Product photos: Supabase Storage, and placehold.co for the sample data in supabase/seed.sql.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.postimg.cc" },
    ],
  },
  // The proxy itself (only added when it's on; static exports can't use rewrites).
  ...(useSupabaseProxy && {
    async rewrites() {
      return [{ source: `${SUPABASE_PROXY_PATH}/:path*`, destination: `${supabaseUrl}/:path*` }];
    },
  }),
  // `orders.server.tsx` is the page `/orders` (server builds only, see above).
  pageExtensions: ["tsx", "ts", "server.tsx", "server.ts"],
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
