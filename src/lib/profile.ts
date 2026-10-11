import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isLang, type Lang } from "./i18n/translate.ts";

export interface Profile {
  displayName: string;
  language: Lang | null;
}

/** The friendliest name we have: the saved display name, then the signup name, then the start of the email. */
export function nameFor(user: User, displayName: string | null | undefined): string {
  const fromMeta = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";
  return displayName?.trim() || fromMeta.trim() || user.email?.split("@")[0] || "there";
}

export async function loadProfile(supabase: SupabaseClient, user: User): Promise<Profile> {
  const { data } = await supabase.from("profiles").select("display_name, preferred_language").eq("id", user.id).maybeSingle();
  return {
    displayName: nameFor(user, data?.display_name),
    language: isLang(data?.preferred_language) ? data.preferred_language : null,
  };
}
