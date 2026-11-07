import "server-only";
import type { AdminSession } from "@/lib/auth";
import { isProductId } from "@/lib/cart";
import type { Tables } from "@/types/database";

export type AdminProduct = Pick<
  Tables<"products">,
  "id" | "title" | "brand" | "price" | "stock" | "images"
>;

/** Every product, including those without stock (never cached: admin data). */
export async function getAdminProducts(
  supabase: AdminSession["supabase"],
): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, brand, price, stock, images")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load products: ${error.message}`);
  return data;
}

export type EditableProduct = Pick<
  Tables<"products">,
  "id" | "title" | "brand" | "description" | "price" | "stock" | "images"
>;

/** One product for the edit form (null if it does not exist). */
export async function getEditableProduct(
  supabase: AdminSession["supabase"],
  id: string,
): Promise<EditableProduct | null> {
  if (!isProductId(id)) return null;
  const { data, error } = await supabase
    .from("products")
    .select("id, title, brand, description, price, stock, images")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data;
}

/** Brands already used, most frequent first (suggestions in the form). */
export async function getUsedBrands(
  supabase: AdminSession["supabase"],
  limit = 8,
): Promise<string[]> {
  const { data, error } = await supabase.from("products").select("brand");
  if (error) return [];
  const counts = new Map<string, number>();
  for (const { brand } of data) {
    if (brand) counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es-AR"))
    .slice(0, limit)
    .map(([brand]) => brand);
}
