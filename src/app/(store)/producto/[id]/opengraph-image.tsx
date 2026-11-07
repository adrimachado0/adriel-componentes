import { cacheLife, cacheTag } from "next/cache";
import { getProduct, PRODUCTS_TAG } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { brandCardJpeg, OG_SIZE, photoToOgJpeg } from "@/lib/og";
import { productImageUrl } from "@/lib/site";

export const alt = "Componente de PC en venta en Adriel Componentes";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

/** Link preview for WhatsApp and social networks: the cover photo, or a branded card. */
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jpeg = await renderProductOgImage(id);
  return new Response(jpeg, {
    headers: { "Content-Type": "image/jpeg" },
  });
}

async function renderProductOgImage(
  id: string,
): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("days");
  cacheTag(PRODUCTS_TAG);

  const product = await getProduct(id);
  const cover = product?.images[0];
  if (cover) {
    const res = await fetch(productImageUrl(cover));
    if (res.ok)
      return toArrayBufferView(await photoToOgJpeg(await res.arrayBuffer()));
  }
  return toArrayBufferView(
    await brandCardJpeg(
      product
        ? { title: product.title, subtitle: formatPrice(product.price) }
        : { title: "Componentes de PC" },
    ),
  );
}

// Response bodies need a plain ArrayBuffer-backed view.
function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes);
}
