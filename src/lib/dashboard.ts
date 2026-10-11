import { compare } from "./engine/runner.ts";
import type { CaseResult, RunRequest } from "./engine/types.ts";

export type ExperimentStatus = "A" | "B" | "tie" | "incomplete";

export interface ExperimentSummary {
  /** Pass rate of prompt A and B as fractions from 0 to 1. */
  a: number;
  b: number;
  status: ExperimentStatus;
  /** Every test case got an answer from both prompts and no call failed. */
  complete: boolean;
}

interface RunLike {
  name?: string | null;
  request: RunRequest;
  results: CaseResult[];
}

export function summarizeExperiment(run: RunLike): ExperimentSummary {
  const total = run.request.cases.length;
  const c = compare(run.results, total);
  const complete = run.results.length === total * 2 && run.results.every((r) => !r.error);
  return { a: c.a.passRate, b: c.b.passRate, status: complete ? c.winner : "incomplete", complete };
}

/** Only numbers that can be worked out from saved data: how many finished cleanly and the mean pass rate. */
export function summarizeExperiments(runs: RunLike[]): { completed: number; avgPassRate: number | null } {
  if (runs.length === 0) return { completed: 0, avgPassRate: null };

  let completed = 0;
  let sum = 0;
  for (const run of runs) {
    const s = summarizeExperiment(run);
    if (s.complete) completed += 1;
    sum += (s.a + s.b) / 2;
  }
  return { completed, avgPassRate: sum / runs.length };
}

export function experimentName(run: { name?: string | null; request: RunRequest }): string {
  return run.name?.trim() || `${run.request.a.name} vs ${run.request.b.name}`;
}
