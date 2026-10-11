import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

/** A Supabase client that acts as the signed-in user, using the session cookies. Null when not configured. */
export async function createClient(): Promise<SupabaseClient | null> {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, which cannot set cookies. The middleware refreshes the session instead.
        }
      },
    },
  });
}

/**
 * The signed-in user, checked with the Supabase Auth server (getUser) rather than trusting the
 * cookie contents, which a browser could forge. Never take a user id from the request body.
 */
export async function getUser(): Promise<{ supabase: SupabaseClient | null; user: User | null }> {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
