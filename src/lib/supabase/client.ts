import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

let browserClient: SupabaseClient | null = null;

/** The Supabase client for browser code, or null when Supabase is not configured. */
export function getBrowserClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  browserClient ??= createBrowserClient(env.url, env.anonKey);
  return browserClient;
}
