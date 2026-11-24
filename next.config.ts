import type { NextConfig } from "next";

// The site is deployed to GitHub Pages as plain static files, so there is no Node server:
// no API routes, getServerSideProps, middleware or Next's built-in i18n routing.
// Arabic/English pages are pre-rendered under `src/pages/[locale]/` instead (see src/i18n/static.ts).
//
// On GitHub Pages the site lives under /<repo-name>; the deploy workflow passes that in
// as PAGES_BASE_PATH. Locally it is empty, so the site runs at /.
const basePath = process.env.PAGES_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // next/image and CSS `url()` don't add basePath on their own; `assetPath()` uses this.
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  // `/en/` -> `en/index.html`, which is how GitHub Pages serves folders.
  trailingSlash: true,
  // There is no image optimization server on GitHub Pages.
  images: { unoptimized: true },
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
