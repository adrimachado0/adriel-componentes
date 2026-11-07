"use server";

import { z } from "zod";
import { MAX_CART_LINES, type FreshProduct } from "@/lib/cart";
import { getProductsByIds } from "@/lib/data/products";

const idsSchema = z.array(z.uuid()).max(MAX_CART_LINES);

export type CartProductsResult =
  { ok: true; products: FreshProduct[] } | { ok: false };

/**
 * Public, read-only: returns fresh data for the products in a visitor's cart.
 * Input comes from localStorage, so it is validated before touching the DB.
 */
export async function getCartProducts(
  ids: unknown,
): Promise<CartProductsResult> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false };
  try {
    return { ok: true, products: await getProductsByIds(parsed.data) };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
