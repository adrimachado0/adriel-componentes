import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";
import { SESSION_ONLY_COOKIE, withRememberPreference } from "./cookies";

/**
 * Supabase client bound to the request cookies (admin session).
 * Create one per request; never share it between requests.
 */
export async function createServerSupabase(options?: {
  sessionOnly?: boolean;
}) {
  const cookieStore = await cookies();
  const sessionOnly =
    options?.sessionOnly ?? cookieStore.get(SESSION_ONLY_COOKIE)?.value === "1";

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options: cookieOptions } of cookiesToSet) {
            cookieStore.set(
              name,
              value,
              withRememberPreference(cookieOptions, sessionOnly),
            );
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // proxy.ts refreshes the session on every /admin request instead.
        }
      },
    },
  });
}
