"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { verifyAdminAction } from "@/lib/auth";
import { PRODUCTS_TAG } from "@/lib/data/products";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOT_ALLOWED: ActionResult = {
  ok: false,
  error: "Tu sesión venció. Volvé a iniciar sesión.",
};

const BUCKET = "product-images";

/** Public pages read cached data tagged "products"; the admin list is dynamic. */
function revalidateProduct(id: string) {
  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  revalidatePath(`/producto/${id}`);
  revalidatePath("/admin");
}

const stockSchema = z.object({
  id: z.uuid(),
  stock: z.int().min(0).max(9999),
});

export async function updateStock(input: {
  id: string;
  stock: number;
}): Promise<ActionResult> {
  const parsed = stockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cantidad inválida." };

  const admin = await verifyAdminAction();
  if (!admin) return NOT_ALLOWED;

  const { data, error } = await admin.supabase
    .from("products")
    .update({ stock: parsed.data.stock })
    .eq("id", parsed.data.id)
    .select("id");

  if (error || data.length === 0) {
    return { ok: false, error: "No se pudo actualizar el stock." };
  }
  revalidateProduct(parsed.data.id);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Componente inválido." };

  const admin = await verifyAdminAction();
  if (!admin) return NOT_ALLOWED;

  const { data, error } = await admin.supabase
    .from("products")
    .delete()
    .eq("id", parsed.data)
    .select("images");

  if (error || data.length === 0) {
    return { ok: false, error: "No se pudo eliminar el componente." };
  }

  // Remove its photos. The row is already gone, so a Storage failure only
  // leaves orphan files: log it instead of failing the whole action.
  const paths = (data[0]?.images ?? []).filter((p) =>
    p.startsWith("products/"),
  );
  if (paths.length > 0) {
    const { error: storageError } = await admin.supabase.storage
      .from(BUCKET)
      .remove(paths);
    if (storageError) {
      console.error("Could not remove product images", paths, storageError);
    }
  }

  revalidateProduct(parsed.data);
  return { ok: true };
}
