import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { CaseResult, RunRequest, SavedRun } from "./engine/types.ts";
import { getUser } from "./supabase/server";

export function problem(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

/** Resolves the signed-in user on the server. Everything that touches private data starts here. */
export async function requireUser(): Promise<{ supabase: SupabaseClient; user: User } | { error: Response }> {
  const { supabase, user } = await getUser();
  if (!supabase) return { error: problem("Accounts are not set up on this server.", 503) };
  if (!user) return { error: problem("Sign in to continue.", 401) };
  return { supabase, user };
}

export interface RunRow {
  id: string;
  name: string | null;
  created_at: string;
  request: RunRequest;
  results: CaseResult[];
}

export const RUN_COLUMNS = "id, name, created_at, request, results";

export function toSavedRun(row: RunRow): SavedRun {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name ?? undefined,
    request: row.request,
    results: row.results,
  };
}

export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    return { ok: false, response: problem("Send the request as JSON.", 415) };
  }
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: problem("The request body must be valid JSON.", 400) };
  }
}

export function firstIssue(error: { issues: { message: string; path: (string | number)[] }[] }): string {
  const issue = error.issues[0];
  return issue?.message ?? "The request is not valid.";
}
