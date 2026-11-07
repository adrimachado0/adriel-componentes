"use server";

import { revalidatePath, updateTag } from "next/cache";
import { verifyAdminAction } from "@/lib/auth";
import { SHARE_LINKS_TAG } from "@/lib/data/share-links";
import { isSlug } from "@/lib/slug";
import {
  SHARE_LINK_SLUG_MAX,
  shareLinkErrorsOf,
  shareLinkFromFormData,
  shareLinkSchema,
  type ShareLinkErrors,
} from "@/lib/validation/share-link";

const SESSION_EXPIRED = "Tu sesión venció. Volvé a iniciar sesión.";

export type CreateShareLinkState =
  | { status: "idle" }
  | { status: "error"; message: string | null; fieldErrors: ShareLinkErrors }
  | { status: "success"; slug: string };

function revalidateShareLinks() {
  updateTag(SHARE_LINKS_TAG);
  revalidatePath("/admin/links");
}

export async function createShareLink(
  _prev: CreateShareLinkState,
  formData: FormData,
): Promise<CreateShareLinkState> {
  const parsed = shareLinkSchema.safeParse(shareLinkFromFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: null,
      fieldErrors: shareLinkErrorsOf(parsed.error),
    };
  }

  const admin = await verifyAdminAction();
  if (!admin) {
    return { status: "error", message: SESSION_EXPIRED, fieldErrors: {} };
  }

  const { error } = await admin.supabase
    .from("share_links")
    .insert(parsed.data);
  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: null,
        fieldErrors: { slug: "Ya tenés un link con ese nombre." },
      };
    }
    console.error("Could not create share link", error);
    return {
      status: "error",
      message: "No se pudo crear el link. Intentá de nuevo.",
      fieldErrors: {},
    };
  }

  revalidateShareLinks();
  return { status: "success", slug: parsed.data.slug };
}

export type DeleteShareLinkResult = { ok: true } | { ok: false; error: string };

export async function deleteShareLink(
  slug: string,
): Promise<DeleteShareLinkResult> {
  if (!isSlug(slug, SHARE_LINK_SLUG_MAX)) {
    return { ok: false, error: "Link inválido." };
  }

  const admin = await verifyAdminAction();
  if (!admin) return { ok: false, error: SESSION_EXPIRED };

  const { data, error } = await admin.supabase
    .from("share_links")
    .delete()
    .eq("slug", slug)
    .select("slug");
  if (error || data.length === 0) {
    return { ok: false, error: "No se pudo eliminar el link." };
  }

  revalidateShareLinks();
  return { ok: true };
}
