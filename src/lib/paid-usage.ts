import type { SupabaseClient } from "@supabase/supabase-js";

import { evaluateUsage, limitMessage, readLimits } from "./usage";

export type Reservation = { ok: true } | { ok: false; status: number; message: string };

async function countSince(supabase: SupabaseClient, sinceIso: string) {
  return supabase.from("api_usage").select("id", { count: "exact", head: true }).gte("created_at", sinceIso);
}

/**
 * Checks this account's paid-run allowance and, if there is room, records the run before it starts.
 * Row level security means the account can only see and add its own rows, and cannot delete them,
 * so the allowance cannot be reset from the browser. If the database cannot be reached the run is
 * refused: a paid API key is never used without a record.
 */
export async function reservePaidRun(supabase: SupabaseClient, userId: string, calls: number): Promise<Reservation> {
  const limits = readLimits(process.env);
  const now = Date.now();

  const [hour, day] = await Promise.all([
    countSince(supabase, new Date(now - 60 * 60 * 1000).toISOString()),
    countSince(supabase, new Date(now - 24 * 60 * 60 * 1000).toISOString()),
  ]);
  if (hour.error || day.error) {
    return { ok: false, status: 503, message: "We could not check your usage right now. Please try again in a moment." };
  }

  const verdict = evaluateUsage(hour.count ?? 0, day.count ?? 0, limits);
  if (!verdict.ok) return { ok: false, status: 429, message: limitMessage(verdict.reason, limits) };

  const { error } = await supabase.from("api_usage").insert({ user_id: userId, calls });
  if (error) return { ok: false, status: 503, message: "We could not record this run. Please try again in a moment." };

  return { ok: true };
}
