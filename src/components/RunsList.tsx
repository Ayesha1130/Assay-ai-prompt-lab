"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { compare } from "@/lib/engine/runner";
import type { SavedRun } from "@/lib/engine/types";
import { pct, when } from "@/lib/format";
import { SIDE_STYLE } from "@/lib/side";
import { experimentName } from "@/lib/dashboard";
import { deleteRun, listRuns } from "@/lib/store";

import { LegacyImport } from "./LegacyImport";

export function RunsList() {
  const [runs, setRuns] = useState<SavedRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listRuns()
      .then(setRuns)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Your runs could not be loaded."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    setActionError(null);
    const before = runs;
    setRuns((current) => current?.filter((r) => r.id !== id) ?? null);
    try {
      await deleteRun(id);
    } catch {
      setRuns(before);
      setActionError("That run could not be deleted. Try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
      <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">History</h1>
      <p className="mt-2 text-mute">Your saved experiments. Only you can see them.</p>

      <div className="mt-6">
        <LegacyImport onImported={load} />
      </div>
      {actionError ? (
        <p role="alert" className="mt-4 text-sm text-fail">
          {actionError}
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="mt-10 rounded-xl border border-fail/60 bg-fail/10 p-6">
          <p className="font-bold">Your runs could not be loaded</p>
          <p className="mt-1 text-sm">{error}</p>
          <button type="button" onClick={load} className="btn btn-quiet btn-sm mt-4">
            Try again
          </button>
        </div>
      ) : runs === null ? (
        <div className="mt-10 grid gap-3" aria-busy="true" aria-label="Loading your runs">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line p-8">
          <p className="text-lg font-bold">No runs yet</p>
          <p className="mt-1 text-mute">Compare two prompts in the lab and the result shows up here.</p>
          <Link href="/lab?preset=blank" className="btn btn-primary mt-5">
            Open the lab
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line/70 border-y border-line/70">
          {runs.map((run) => {
            const c = compare(run.results, run.request.cases.length);
            const winnerName = c.winner === "tie" ? "Dead heat" : `${c.winner === "A" ? run.request.a.name : run.request.b.name} won`;
            return (
              <li key={run.id} className="flex items-center gap-3">
                <Link href={`/runs/${run.id}`} className="grid min-w-0 flex-1 gap-1 py-4 hover:bg-panel/50 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-2">
                  <span className="text-sm text-mute">{when(run.createdAt)}</span>
                  <span className="min-w-0 truncate font-semibold">
                    {run.name ? <>{experimentName(run)}: </> : null}
                    <span className={SIDE_STYLE.A.text}>{run.request.a.name}</span> versus <span className={SIDE_STYLE.B.text}>{run.request.b.name}</span>
                  </span>
                  <span className="text-sm">
                    <span className={SIDE_STYLE.A.text}>A {pct(c.a.passRate)}</span>, <span className={SIDE_STYLE.B.text}>B {pct(c.b.passRate)}</span>
                    <span className="ml-3 font-bold">{winnerName}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(run.id)}
                  aria-label={`Delete the run from ${when(run.createdAt)}`}
                  className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-mute transition-colors hover:border-fail hover:text-fail"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
