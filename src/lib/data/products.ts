import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isProductId, type FreshProduct } from "@/lib/cart";
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
 * One product for the detail page (also when stock is 0, so shared links show
 * "Sin stock" instead of a 404). Returns null for unknown or malformed ids.
 */
export async function getProduct(id: string): Promise<StoreProduct | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  if (!isProductId(id)) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(STORE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data;
}

/**
 * "También te puede interesar": other products in stock, same brand first,
 * then the newest ones.
 */
export async function getRelatedProducts(
  product: Pick<StoreProduct, "id" | "brand">,
  limit = 4,
): Promise<StoreProduct[]> {
  const others = (await getStoreProducts()).filter((p) => p.id !== product.id);
  const sameBrand = product.brand
    ? others.filter((p) => p.brand === product.brand)
    : [];
  const rest = others.filter((p) => !sameBrand.includes(p));
  return [...sameBrand, ...rest].slice(0, limit);
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
