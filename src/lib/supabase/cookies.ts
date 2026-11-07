import type { CookieOptions } from "@supabase/ssr";

/**
 * "Mantener la sesión iniciada" unchecked → this cookie is set to "1" and
 * every auth cookie is written without maxAge/expires, so the browser drops
 * it when it closes. It is not secret (only a preference).
 */
export const SESSION_ONLY_COOKIE = "ac-session-only";

export function withRememberPreference(
  options: CookieOptions,
  sessionOnly: boolean,
): CookieOptions {
  // Deletions (maxAge 0) must keep their maxAge to actually remove the cookie.
  if (!sessionOnly || !options.maxAge || options.maxAge <= 0) return options;
  const sessionCookie = { ...options };
  delete sessionCookie.maxAge;
  delete sessionCookie.expires;
  return sessionCookie;
}
