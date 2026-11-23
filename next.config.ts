import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is left off for now: Redux creates its store with
  // Math.random() during render, which Cache Components rejects at prerender.
  // We can revisit enabling it once the store's data layer is in place.
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
