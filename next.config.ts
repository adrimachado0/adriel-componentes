import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (see .env.example)");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Only product photos from our public bucket can be optimized.
    remotePatterns: [
      new URL(`${supabaseUrl}/storage/v1/object/public/product-images/**`),
    ],
    qualities: [75],
  },
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
