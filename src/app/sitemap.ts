import type { MetadataRoute } from "next";
import { getStoreProducts } from "@/lib/data/products";
import { env } from "@/lib/env";

/** Home + every product in stock. The admin panel is never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getStoreProducts();
  return [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    ...products.map((product) => ({
      url: `${env.siteUrl}/producto/${product.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
