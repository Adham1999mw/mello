import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Built-in Pages Router i18n routing: `/` = Arabic (default), `/en` = English.
  i18n: {
    locales: ["ar", "en"],
    defaultLocale: "ar",
  },
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
