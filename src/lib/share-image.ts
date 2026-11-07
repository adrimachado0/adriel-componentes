// Share-image (Open Graph) URLs. Kept free of server-only imports so the
// admin form can show the same recommendation.

/** What WhatsApp, Facebook, Instagram DMs, X and LinkedIn render best. */
export const SHARE_IMAGE = {
  width: 1200,
  height: 630,
  minWidth: 600,
  minHeight: 315,
} as const;

/** Home page share image (route handler at app/compartir.jpg). */
export const HOME_SHARE_IMAGE_PATH = "/compartir.jpg";

/**
 * Product share image. `v` changes whenever the product is saved, so
 * WhatsApp/Facebook (which cache previews by URL) pick up the new image.
 */
export function productShareImagePath(slug: string, updatedAt: string): string {
  const version = Date.parse(updatedAt);
  return `/producto/${slug}/compartir.jpg?v=${Number.isNaN(version) ? 0 : version}`;
}
