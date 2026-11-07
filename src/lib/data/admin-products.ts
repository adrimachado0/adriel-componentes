import "server-only";
import type { AdminSession } from "@/lib/auth";
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
