import { NextResponse } from "next/server";

import { safeNext } from "@/lib/auth/redirect";
import { siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase sends people after Google sign-in, email confirmation and password-reset links.
 * It swaps the one-time code for a session cookie, then redirects to a validated same-site path.
 */
export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const next = safeNext(params.get("next"));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
