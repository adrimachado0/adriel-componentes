import { cacheLife, cacheTag } from "next/cache";
import { getProduct, PRODUCTS_TAG } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { brandCardJpeg, photoToOgJpeg, shareImageToOgJpeg } from "@/lib/og";
import { productImageUrl } from "@/lib/site";

/**
 * Product share image (Open Graph / WhatsApp), always a 1200×630 JPEG:
 *   1. the custom share image, if one was uploaded (cropped from the center);
 *   2. otherwise the cover photo, whole, on the store background;
 *   3. otherwise a branded card with title and price.
 * The URL carries ?v=<updated_at> (see productShareImagePath), so a CDN or a
 * social network can cache each version for a long time.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/producto/[slug]/compartir.jpg">,
) {
  const { slug } = await params;
  const jpeg = await renderProductShareImage(slug);
  if (!jpeg) return new Response("Not found", { status: 404 });
  return new Response(jpeg, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

async function renderProductShareImage(
  slug: string,
): Promise<Uint8Array<ArrayBuffer> | null> {
  "use cache";
  cacheLife("days");
  cacheTag(PRODUCTS_TAG);

  const product = await getProduct(slug);
  if (!product) return null;

  const custom = product.og_image;
  const cover = product.images[0];
  const source = custom ?? cover;
  if (source) {
    const res = await fetch(productImageUrl(source));
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      return new Uint8Array(
        custom ? await shareImageToOgJpeg(bytes) : await photoToOgJpeg(bytes),
      );
    }
  }
  return new Uint8Array(
    await brandCardJpeg({
      title: product.title,
      subtitle: formatPrice(product.price),
    }),
  );
}
