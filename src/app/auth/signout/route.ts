import { NextResponse } from "next/server";

import { isSameOrigin, siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Sign out is a POST so a link or image on another site cannot sign someone out. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();

  // 303 turns the POST into a GET on the home page.
  return NextResponse.redirect(new URL("/", siteOrigin(request)), { status: 303 });
}
