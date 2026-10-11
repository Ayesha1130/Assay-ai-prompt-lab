import type { CaseResult, RunRequest, SavedRun } from "./engine/types";

/**
 * Saved experiments live in the user's account and are reached through the server's /api/experiments
 * routes, which check who is signed in and let the database enforce ownership. This file also reads
 * experiments the first version kept in this browser, so they can be imported into an account.
 */

const LEGACY_KEY = "assay.runs.v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as ({ error?: string } & Record<string, unknown>) | null;
  if (!res.ok) throw new ApiError(body?.error ?? `The request failed (status ${res.status}).`, res.status);
  return body as T;
}

export async function listRuns(): Promise<SavedRun[]> {
  return (await call<{ runs: SavedRun[] }>("/api/experiments")).runs;
}

/** Returns null when the experiment does not exist or belongs to someone else. */
export async function getRun(id: string): Promise<SavedRun | null> {
  try {
    return (await call<{ run: SavedRun }>(`/api/experiments/${encodeURIComponent(id)}`)).run;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface NewRun {
  request: RunRequest;
  results: CaseResult[];
  name?: string;
}

export async function saveRun(run: NewRun): Promise<SavedRun> {
  return (await call<{ run: SavedRun }>("/api/experiments", { method: "POST", body: JSON.stringify(run) })).run;
}

export async function renameRun(id: string, name: string): Promise<SavedRun> {
  return (
    await call<{ run: SavedRun }>(`/api/experiments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    })
  ).run;
}

export async function deleteRun(id: string): Promise<void> {
  await call(`/api/experiments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Experiments saved in this browser before accounts existed ----

export function readLegacyRuns(): SavedRun[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedRun[]) : [];
  } catch {
    return [];
  }
}

/**
 * Copies browser-only experiments into the account, one at a time. The server validates each one.
 * Only the ones that were saved successfully are removed from the browser, so nothing is lost.
 */
export async function importLegacyRuns(): Promise<{ imported: number; failed: number }> {
  const runs = readLegacyRuns();
  const remaining: SavedRun[] = [];
  let imported = 0;

  for (const run of runs) {
    try {
      await saveRun({ request: run.request, results: run.results, name: run.name });
      imported += 1;
    } catch {
      remaining.push(run);
    }
  }

  try {
    if (remaining.length === 0) window.localStorage.removeItem(LEGACY_KEY);
    else window.localStorage.setItem(LEGACY_KEY, JSON.stringify(remaining));
  } catch {
    // Storage is blocked. The experiments are in the account either way.
  }
  return { imported, failed: remaining.length };
}
