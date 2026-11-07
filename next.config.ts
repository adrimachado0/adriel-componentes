import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (see .env.example)");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site is never meant to be embedded in another page.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Client router cache: pages already visited are reused instead of
    // refetched (back/forward and repeat visits). Saving from the panel
    // still refreshes them right away (updateTag / revalidatePath).
    staleTimes: {
      dynamic: 30, // admin pages (per-session, never prerendered)
      static: 300, // store pages and fully prefetched links
    },
  },
  images: {
    // Only product photos from our public bucket can be optimized.
    remotePatterns: [
      new URL(`${supabaseUrl}/storage/v1/object/public/product-images/**`),
    ],
    qualities: [75],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
