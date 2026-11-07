// Absolute base URL for metadata (Open Graph), sitemap and robots.
//
// Social crawlers (WhatsApp, Facebook…) need absolute image URLs on the real
// domain. If NEXT_PUBLIC_SITE_URL was left as localhost on Vercel, fall back to
// the project's production domain that Vercel provides, instead of publishing
// links nobody outside your machine can open.

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

function isLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(
    url,
  );
}

export function resolveSiteUrl(env: SiteUrlEnv): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const vercelDomain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const onVercel = env.VERCEL === "1" && Boolean(vercelDomain);

  if (configured && !(onVercel && isLocal(configured))) return configured;
  if (onVercel) return `https://${vercelDomain}`;
  return configured || "http://localhost:3000";
}

/** Server-side: reads the real process environment. */
export function getSiteUrl(): string {
  return resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
}
