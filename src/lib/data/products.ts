import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { FreshProduct } from "@/lib/cart";
import type { Tables } from "@/types/database";

export const PRODUCTS_TAG = "products";

export type StoreProduct = Pick<
  Tables<"products">,
  "id" | "title" | "description" | "brand" | "price" | "stock" | "images"
>;

const STORE_COLUMNS = "id, title, description, brand, price, stock, images";

/**
 * Every product in stock, newest first. The catalog is small, so one cached
 * list feeds the grid, the brand chips and the hero count; brand filtering
 * happens on the server over this list.
 */
export async function getStoreProducts(): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(STORE_COLUMNS)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load products: ${error.message}`);
  return data;
}

/**
 * Fresh (uncached) data for the cart: current title, brand, price, stock and
 * cover. Products that no longer exist are simply absent from the result.
 */
export async function getProductsByIds(ids: string[]): Promise<FreshProduct[]> {
  if (ids.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select("id, title, brand, price, stock, images")
    .in("id", ids);

  if (error) throw new Error(`Could not load cart products: ${error.message}`);
  return data.map(({ images, ...product }) => ({
    ...product,
    image: images[0] ?? null,
  }));
}

/** Distinct, non-empty brands, sorted alphabetically (es-AR collation). */
export function getBrands(products: StoreProduct[]): string[] {
  const brands = new Set<string>();
  for (const product of products) {
    if (product.brand) brands.add(product.brand);
  }
  return [...brands].sort((a, b) =>
    a.localeCompare(b, "es-AR", { sensitivity: "base" }),
  );
}
