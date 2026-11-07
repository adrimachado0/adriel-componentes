import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminSession = {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  userId: string;
  email: string;
};

/**
 * Admin session for rendering (pages/layouts). getClaims() verifies the JWT
 * signature; the role comes from app_metadata, which users cannot edit.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  if (data.claims.app_metadata?.role !== "admin") return null;
  return { supabase, userId: data.claims.sub, email: data.claims.email ?? "" };
}

/** For pages: redirects to the login without an admin session. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * For Server Actions (mutations): asks the Auth server with getUser(), so a
 * revoked session or a removed admin role is caught immediately.
 * Defense in depth on top of RLS.
 */
export async function verifyAdminAction(): Promise<AdminSession | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (data.user.app_metadata?.role !== "admin") return null;
  return { supabase, userId: data.user.id, email: data.user.email ?? "" };
}
