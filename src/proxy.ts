import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  SESSION_ONLY_COOKIE,
  withRememberPreference,
} from "@/lib/supabase/cookies";
import type { Database } from "@/types/database";

const LOGIN_PATH = "/admin/login";

/**
 * Runs on /admin/* and on old product links (/producto/<uuid>, see config).
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/producto/")) {
    return redirectOldProductLink(request);
  }
  return adminProxy(request);
}

/**
 * Product pages used to live at /producto/<id>. Links already shared on
 * WhatsApp or Facebook get a permanent redirect to /producto/<slug>.
 */
async function redirectOldProductLink(request: NextRequest) {
  const [, , id, ...rest] = request.nextUrl.pathname.split("/");
  const supabase = createClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id ?? "")
    .maybeSingle();
  // Unknown id: the page itself answers with the store's 404.
  if (!data) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = ["", "producto", data.slug, ...rest].join("/");
  return NextResponse.redirect(url, 308);
}

/**
 * /admin/*: refreshes the Supabase session cookies and redirects
 * to the login when there is no admin session. This is an optimistic check;
 * pages and Server Actions verify the session again.
 */
async function adminProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(
            name,
            value,
            withRememberPreference(options, sessionOnly),
          );
        }
        // Responses that set auth cookies must never be cached by a CDN.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Do not run code between createServerClient and getClaims: getClaims
  // validates the JWT and refreshes the session when needed.
  const { data } = await supabase.auth.getClaims();
  const isAdmin = data?.claims.app_metadata?.role === "admin";
  const { pathname, search } = request.nextUrl;
  const onLogin = pathname === LOGIN_PATH;

  if (!isAdmin && !onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(url, response);
  }

  if (isAdmin && onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  return response;
}

/** Redirect that carries over any refreshed auth cookies and cache headers. */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/producto/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/:rest*",
  ],
};
