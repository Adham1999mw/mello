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
// Both modes use the same URLs: `/` and `/ar/` (Arabic), `/en/` (English), from `src/pages/[locale]/`.
const isStaticExport = process.env.STATIC_EXPORT === "true";
// Product photos come from Supabase Storage (and placeholders in the seed data).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";
const basePath = isStaticExport ? process.env.PAGES_BASE_PATH || undefined : undefined;

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath,
  // next/image and CSS `url()` don't add basePath on their own; `assetPath()` uses this.
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  // `/en/` -> `en/index.html` on GitHub Pages; kept on the server too so URLs match.
  trailingSlash: true,
  // GitHub Pages has no image optimization server; the real server does.
  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
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
