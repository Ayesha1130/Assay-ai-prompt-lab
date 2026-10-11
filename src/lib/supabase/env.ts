/**
 * Public Supabase settings. The URL and the publishable (anon) key are meant to be visible in the
 * browser: what protects the data is row level security, not hiding these. The service-role key
 * is never used by this app and must never be added to a NEXT_PUBLIC_ variable.
 *
 * Each variable is written out in full so Next.js can inline it into browser code.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Shown on the sign-in pages only when the project owner has set up the Google provider. */
export function googleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
