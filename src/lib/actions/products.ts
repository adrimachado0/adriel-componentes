"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { verifyAdminAction } from "@/lib/auth";
import { isProductId } from "@/lib/cart";
import { PRODUCTS_TAG } from "@/lib/data/products";
import {
  fieldErrorsOf,
  productFromFormData,
  productSchema,
  removedImages,
  type FieldErrors,
} from "@/lib/validation/product";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOT_ALLOWED: ActionResult = {
  ok: false,
  error: "Tu sesión venció. Volvé a iniciar sesión.",
};

const BUCKET = "product-images";

/**
 * Public pages read cached data tagged "products"; the admin list is dynamic.
 * Pass every slug the product had (old and new when it changed).
 */
function revalidateProduct(...slugs: string[]) {
  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  for (const slug of new Set(slugs)) revalidatePath(`/producto/${slug}`);
  revalidatePath("/admin");
}

/** Postgres unique_violation on products.slug. */
function isSlugTaken(error: { code?: string; message?: string }) {
  return error.code === "23505" && Boolean(error.message?.includes("slug"));
}

const SLUG_TAKEN = "Ya hay otro componente con este link. Probá con otro.";

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
    .select("slug");

  if (error || !data[0]) {
    return { ok: false, error: "No se pudo actualizar el stock." };
  }
  revalidateProduct(data[0].slug);
  return { ok: true };
}

const reorderSchema = z
  .array(z.uuid())
  .min(2)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length);

/**
 * Saves the order of the listed products (the visible ones in the admin,
 * maybe filtered): they swap the places they already had among themselves.
 */
export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Orden inválido." };

  const admin = await verifyAdminAction();
  if (!admin) return NOT_ALLOWED;

  const { error } = await admin.supabase.rpc("reorder_products", {
    ids: parsed.data,
  });
  if (error) {
    console.error("Could not reorder products", error);
    return { ok: false, error: "No se pudo guardar el orden." };
  }

  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  revalidatePath("/admin");
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
    .select("slug, images, og_image");

  if (error || !data[0]) {
    return { ok: false, error: "No se pudo eliminar el componente." };
  }

  // Remove its photos. The row is already gone, so a Storage failure only
  // leaves orphan files: log it instead of failing the whole action.
  const deleted = data[0];
  const paths = [
    ...(deleted?.images ?? []),
    ...(deleted?.og_image ? [deleted.og_image] : []),
  ].filter((p) => p.startsWith("products/"));
  if (paths.length > 0) {
    const { error: storageError } = await admin.supabase.storage
      .from(BUCKET)
      .remove(paths);
    if (storageError) {
      console.error("Could not remove product images", paths, storageError);
    }
  }

  revalidateProduct(data[0].slug);
  return { ok: true };
}

export type SaveProductState =
  | { status: "idle" }
  | { status: "error"; message: string | null; fieldErrors: FieldErrors }
  | { status: "success"; id: string; created: boolean };

const SESSION_EXPIRED = "Tu sesión venció. Volvé a iniciar sesión.";

/** Creates (no id) or updates (hidden "id" field) a product. */
export async function saveProduct(
  _prev: SaveProductState,
  formData: FormData,
): Promise<SaveProductState> {
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId !== "" ? rawId : null;
  if (id !== null && !isProductId(id)) {
    return {
      status: "error",
      message: "Componente inválido.",
      fieldErrors: {},
    };
  }

  const parsed = productSchema.safeParse(productFromFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: null,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const admin = await verifyAdminAction();
  if (!admin) {
    return { status: "error", message: SESSION_EXPIRED, fieldErrors: {} };
  }
  const { supabase } = admin;
  const values = parsed.data;

  if (id === null) {
    const { data, error } = await supabase
      .from("products")
      .insert(values)
      .select("id")
      .single();
    if (error) {
      if (isSlugTaken(error)) {
        return {
          status: "error",
          message: null,
          fieldErrors: { slug: SLUG_TAKEN },
        };
      }
      console.error("Could not create product", error);
      return {
        status: "error",
        message: "No se pudo publicar. Intentá de nuevo.",
        fieldErrors: {},
      };
    }
    revalidateProduct(values.slug);
    return { status: "success", id: data.id, created: true };
  }

  const { data: before, error: readError } = await supabase
    .from("products")
    .select("slug, images, og_image")
    .eq("id", id)
    .maybeSingle();
  if (readError || !before) {
    return {
      status: "error",
      message: "Ese componente ya no existe.",
      fieldErrors: {},
    };
  }

  const { error } = await supabase.from("products").update(values).eq("id", id);
  if (error) {
    if (isSlugTaken(error)) {
      return {
        status: "error",
        message: null,
        fieldErrors: { slug: SLUG_TAKEN },
      };
    }
    console.error("Could not update product", error);
    return {
      status: "error",
      message: "No se pudieron guardar los cambios.",
      fieldErrors: {},
    };
  }

  // Photos removed in the form are deleted only once the change is saved,
  // and never a file the product still uses (as a photo or share image).
  const stillUsed = new Set([...values.images, values.og_image ?? ""]);
  const removed = [
    ...removedImages(before.images, values.images),
    // Share image replaced or removed.
    ...(before.og_image && before.og_image !== values.og_image
      ? [before.og_image]
      : []),
  ].filter((p) => p.startsWith("products/") && !stillUsed.has(p));
  if (removed.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove(removed);
    if (storageError)
      console.error("Could not remove images", removed, storageError);
  }

  revalidateProduct(before.slug, values.slug);
  return { status: "success", id, created: false };
}
