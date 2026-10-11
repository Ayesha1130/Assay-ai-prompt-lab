import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./env";

/** Refreshes the session cookies on every request and reports who is signed in. */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null; configured: boolean }> {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return { response, user: null, configured: false };

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser asks the Auth server to validate the token, so an expired or forged cookie is not trusted.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, configured: true };
}
