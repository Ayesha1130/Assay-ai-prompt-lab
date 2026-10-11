import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppNav } from "@/components/app/AppNav";
import { SkipLink } from "@/components/SkipLink";
import { loadProfile } from "@/lib/profile";
import { getUser } from "@/lib/supabase/server";

/**
 * Everything in this group needs a signed-in user. The middleware is the first check; this layout
 * checks again on the server so the pages stay protected even if the middleware is ever changed.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login");

  const profile = await loadProfile(supabase, user);

  return (
    <>
      <SkipLink />
      <AppNav displayName={profile.displayName} />
      <main id="main">{children}</main>
    </>
  );
}
