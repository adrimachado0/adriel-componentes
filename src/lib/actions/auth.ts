"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_ONLY_COOKIE } from "@/lib/supabase/cookies";
import { createServerSupabase } from "@/lib/supabase/server";
import { LOGIN_ERROR, loginSchema, safeAdminPath } from "@/lib/validation/auth";

export type SignInState = { error: string | null; email: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = loginSchema.safeParse({
    email,
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });
  if (!parsed.success) return { error: LOGIN_ERROR, email };

  const { remember } = parsed.data;
  const cookieStore = await cookies();
  if (remember) {
    cookieStore.delete(SESSION_ONLY_COOKIE);
  } else {
    cookieStore.set(SESSION_ONLY_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  const supabase = await createServerSupabase({ sessionOnly: !remember });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || data.user?.app_metadata?.role !== "admin") {
    // A valid non-admin account gets the same generic error and no session.
    if (!error) await supabase.auth.signOut();
    return { error: LOGIN_ERROR, email };
  }

  redirect(safeAdminPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  (await cookies()).delete(SESSION_ONLY_COOKIE);
  redirect("/admin/login");
}
