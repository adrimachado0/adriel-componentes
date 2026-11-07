import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { AdminSession } from "@/lib/auth";
import { isSlug } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import {
  SHARE_LINK_SLUG_MAX,
  SHARE_SOURCES,
  type ShareSource,
} from "@/lib/validation/share-link";
import type { Tables } from "@/types/database";

export const SHARE_LINKS_TAG = "share-links";

export type ShareLink = Tables<"share_links">;

/** Every share link, newest first (admin only, never cached). */
export async function getShareLinks(
  supabase: AdminSession["supabase"],
): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from("share_links")
    .select("slug, source, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load share links: ${error.message}`);
  return data;
}

/** utm_source of one link (null if it does not exist), for the /de/<slug> redirect. */
export async function getShareLinkSource(
  slug: string,
): Promise<ShareSource | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(SHARE_LINKS_TAG);

  if (!isSlug(slug, SHARE_LINK_SLUG_MAX)) return null;
  const { data, error } = await createPublicClient().rpc("share_link_source", {
    link_slug: slug,
  });

  if (error) throw new Error(`Could not load share link: ${error.message}`);
  return typeof data === "string" && data in SHARE_SOURCES
    ? (data as ShareSource)
    : null;
}
