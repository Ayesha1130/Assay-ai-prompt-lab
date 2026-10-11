import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { experimentName, summarizeExperiment, summarizeExperiments } from "../src/lib/dashboard.ts";
import type { CaseResult, RunRequest } from "../src/lib/engine/types.ts";

const request: RunRequest = {
  a: { name: "Short", template: "x", model: "demo-sim" },
  b: { name: "Strict", template: "y", model: "demo-sim" },
  cases: [
    { id: "c1", input: "i", expected: "e", scorer: "exact" },
    { id: "c2", input: "i", expected: "e", scorer: "exact" },
  ],
};

const r = (side: "A" | "B", caseId: string, pass: boolean, error?: string): CaseResult => ({
  side,
  caseId,
  output: "",
  pass,
  score: pass ? 1 : 0,
  latencyMs: 10,
  inputTokens: 1,
  outputTokens: 1,
  costUsd: 0,
  error,
});

describe("dashboard summaries", () => {
  it("reports the winner and pass rates of a finished experiment", () => {
    const s = summarizeExperiment({
      request,
      results: [r("A", "c1", true), r("B", "c1", true), r("A", "c2", false), r("B", "c2", true)],
    });
    assert.deepEqual(s, { a: 0.5, b: 1, status: "B", complete: true });
  });

  it("calls an experiment incomplete when a call failed or answers are missing", () => {
    const failed = summarizeExperiment({
      request,
      results: [r("A", "c1", true), r("B", "c1", false, "boom"), r("A", "c2", true), r("B", "c2", true)],
    });
    assert.equal(failed.status, "incomplete");
    assert.equal(failed.complete, false);

    const missing = summarizeExperiment({ request, results: [r("A", "c1", true)] });
    assert.equal(missing.status, "incomplete");
  });

  it("reports a tie", () => {
    const s = summarizeExperiment({
      request,
      results: [r("A", "c1", true), r("B", "c1", true), r("A", "c2", false), r("B", "c2", false)],
    });
    assert.equal(s.status, "tie");
  });

  it("has no numbers to show when there are no experiments", () => {
    assert.deepEqual(summarizeExperiments([]), { completed: 0, avgPassRate: null });
  });

  it("counts completed experiments and averages pass rates across both prompts", () => {
    const good = {
      request,
      results: [r("A", "c1", true), r("B", "c1", true), r("A", "c2", false), r("B", "c2", true)], // A 50%, B 100%
    };
    const partial = { request, results: [r("A", "c1", true)] }; // A 50%, B 0%
    const out = summarizeExperiments([good, partial]);
    assert.equal(out.completed, 1);
    assert.equal(out.avgPassRate, (0.75 + 0.25) / 2);
  });

  it("names experiments", () => {
    assert.equal(experimentName({ name: "My test", request }), "My test");
    assert.equal(experimentName({ name: "  ", request }), "Short vs Strict");
    assert.equal(experimentName({ name: null, request }), "Short vs Strict");
    assert.equal(experimentName({ request }), "Short vs Strict");
  });
});
