import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountForm } from "@/components/app/AccountForm";
import { getServerT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login");

  const [t, profile] = await Promise.all([getServerT(), loadProfile(supabase, user)]);

  // The account's real creation date, formatted on the server so it cannot differ between renders.
  const since = user.created_at
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(user.created_at))
    : "—";

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("acct.title")}</h1>
      <p className="mt-2 text-mute">{t("acct.subtitle")}</p>

      <AccountForm
        email={user.email ?? ""}
        initialName={profile.displayName}
        initialLanguage={profile.language}
        since={since}
        canChangePassword={user.app_metadata?.provider === "email" || !user.app_metadata?.provider}
      />
    </div>
  );
}
