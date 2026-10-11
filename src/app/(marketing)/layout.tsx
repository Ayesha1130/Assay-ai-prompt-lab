import type { ReactNode } from "react";

import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteNav } from "@/components/marketing/SiteNav";
import { SkipLink } from "@/components/SkipLink";
import { getUser } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  // Only used to show "Dashboard" instead of "Sign In". Pages here stay open to everyone.
  const { user } = await getUser();

  return (
    <>
      <SkipLink />
      <SiteNav signedIn={Boolean(user)} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
