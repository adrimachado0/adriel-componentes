import { cacheLife } from "next/cache";
import { brandCardJpeg } from "@/lib/og";

/**
 * Home page share image (Open Graph / WhatsApp), 1200×630 JPEG.
 * No runtime data: prerendered at build time.
 */
export async function GET() {
  return new Response(await renderHomeShareImage(), {
    headers: { "Content-Type": "image/jpeg" },
  });
}

async function renderHomeShareImage(): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("max");
  const jpeg = await brandCardJpeg({
    title: "Componentes de PC",
    subtitle: "Hardware usado · Consultas por WhatsApp",
  });
  return new Uint8Array(jpeg);
}
