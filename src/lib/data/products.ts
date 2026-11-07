import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { FreshProduct } from "@/lib/cart";
import { isSlug } from "@/lib/slug";
import type { Tables } from "@/types/database";

export const PRODUCTS_TAG = "products";

export type StoreProduct = Pick<
  Tables<"products">,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "brand"
  | "price"
  | "stock"
  | "images"
  | "og_image"
  | "updated_at"
>;

const STORE_COLUMNS =
  "id, slug, title, description, brand, price, stock, images, og_image, updated_at";

/**
 * Every product (in stock and sold), in the order chosen by the admin. The
 * catalog is small, so one cached list feeds the grid, "Ya vendidos", the
 * brand chips and the hero count; filtering happens on the server over it.
 */
async function getAllStoreProducts(): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(STORE_COLUMNS)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Could not load products: ${error.message}`);
  return data;
}

/** Products in stock, in the admin's order. */
export async function getStoreProducts(): Promise<StoreProduct[]> {
  return (await getAllStoreProducts()).filter((p) => p.stock > 0);
}

/** Sold products (stock 0, every part is a single unit), shown under "Ya vendidos". */
export async function getSoldProducts(): Promise<StoreProduct[]> {
  return (await getAllStoreProducts()).filter((p) => p.stock < 1);
}

/**
 * One product for the detail page (also when stock is 0, so shared links show
 * "Vendido" instead of a 404). Returns null for unknown or malformed slugs.
 */
export async function getProduct(slug: string): Promise<StoreProduct | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  if (!isSlug(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(STORE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data;
}

/**
 * "También te puede interesar": other products in stock, same brand first,
 * then the rest in the admin's order.
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
