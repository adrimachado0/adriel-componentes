import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cookie-less Supabase client for public, cacheable reads ('use cache').
 * It never carries a user session, so RLS applies as the anon role.
 */
export function createPublicClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
