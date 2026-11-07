"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";
import { SESSION_ONLY_COOKIE, withRememberPreference } from "./cookies";

function readCookies() {
  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((pair) => {
      const index = pair.indexOf("=");
      return {
        name: decodeURIComponent(pair.slice(0, index)),
        value: decodeURIComponent(pair.slice(index + 1)),
      };
    });
}

/**
 * Browser client for the admin (direct Storage uploads with the user's
 * session). Token refreshes respect "Mantener la sesión iniciada".
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: readCookies,
      setAll(cookiesToSet) {
        const sessionOnly = readCookies().some(
          (c) => c.name === SESSION_ONLY_COOKIE && c.value === "1",
        );
        for (const { name, value, options } of cookiesToSet) {
          const o = withRememberPreference(options, sessionOnly);
          const parts = [
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
            `Path=${o.path ?? "/"}`,
            `SameSite=${o.sameSite === "strict" ? "Strict" : o.sameSite === "none" ? "None" : "Lax"}`,
          ];
          if (o.maxAge !== undefined) parts.push(`Max-Age=${o.maxAge}`);
          if (o.domain) parts.push(`Domain=${o.domain}`);
          if (o.secure || location.protocol === "https:") parts.push("Secure");
          document.cookie = parts.join("; ");
        }
      },
    },
  });
}
