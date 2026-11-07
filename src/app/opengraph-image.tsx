import { cacheLife } from "next/cache";
import { brandCardJpeg, OG_SIZE } from "@/lib/og";

export const alt = "Adriel Componentes: componentes de PC usados";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

/** Link preview for the home page (WhatsApp and social networks). */
export default async function Image() {
  return new Response(await renderHomeOgImage(), {
    headers: { "Content-Type": "image/jpeg" },
  });
}

async function renderHomeOgImage(): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("max");
  const jpeg = await brandCardJpeg({
    title: "Componentes de PC",
    subtitle: "Hardware usado · Consultas por WhatsApp",
  });
  return new Uint8Array(jpeg);
}
