import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProviderError } from "../src/lib/engine/errors.ts";
import { getModel } from "../src/lib/engine/pricing.ts";
import { hash01, mockComplete, promptQuality } from "../src/lib/engine/providers/mock.ts";
import { buildTasks, compare, fillTemplate, percentile, runComparison, summarize } from "../src/lib/engine/runner.ts";
import { score } from "../src/lib/engine/scorers.ts";
import type { CaseResult, CompleteFn, RunRequest, TestCase } from "../src/lib/engine/types.ts";
import { PRESETS } from "../src/lib/presets.ts";
import { allow } from "../src/lib/rate-limit.ts";

const model = getModel("demo-sim")!;

function request(cases: TestCase[]): RunRequest {
  return {
    a: { name: "A", template: "Answer: {{input}}", model: "demo-sim" },
    b: { name: "B", template: "Reply: {{input}}", model: "demo-sim" },
    cases,
  };
}

const twoCases: TestCase[] = [
  { id: "c1", input: "one", expected: "yes", scorer: "exact" },
  { id: "c2", input: "two", expected: "no", scorer: "exact" },
];

function result(side: "A" | "B", caseId: string, pass: boolean, extra: Partial<CaseResult> = {}): CaseResult {
  return {
    side,
    caseId,
    output: "",
    pass,
    score: pass ? 1 : 0,
    latencyMs: 100,
    inputTokens: 10,
    outputTokens: 5,
    costUsd: 0.001,
    ...extra,
  };
}

describe("fillTemplate", () => {
  it("replaces every placeholder", () => {
    assert.equal(fillTemplate("{{input}} and {{input}}", "x"), "x and x");
  });
  it("appends the input when there is no placeholder", () => {
    assert.equal(fillTemplate("Classify this.  ", "hello"), "Classify this.\n\nhello");
  });
  it("does not treat dollar patterns in the input as replacement syntax", () => {
    assert.equal(fillTemplate("Say {{input}}", "$& $1"), "Say $& $1");
  });
});

describe("scorers", () => {
  it("exact ignores case, quotes, spaces and trailing punctuation", () => {
    assert.equal(score("exact", ' "Billing". ', "billing").pass, true);
    assert.equal(score("exact", "billing issue", "billing").pass, false);
  });
  it("exact fails when no expected answer is set", () => {
    assert.equal(score("exact", "x", "").note, "No expected answer set");
  });
  it("contains finds text inside a longer answer", () => {
    assert.equal(score("contains", "I think it is billing.", "billing").pass, true);
  });
  it("regex handles bad patterns without throwing", () => {
    assert.equal(score("regex", "yes", "^(yes|no)$").pass, true);
    assert.equal(score("regex", "yes", "(").note, "Invalid regex");
  });
  it("json checks keys and gives partial credit", () => {
    assert.equal(score("json", '{"name":"a","email":"b"}', "name, email").pass, true);
    const partial = score("json", '```json\n{"name":"a"}\n```', "name, email");
    assert.equal(partial.pass, false);
    assert.equal(partial.score, 0.5);
    assert.equal(partial.note, "Missing keys: email");
    assert.equal(score("json", "Here you go: {}", "name").note, "Output is not valid JSON");
  });
  it("maxWords enforces the limit", () => {
    assert.equal(score("maxWords", "one two three", "3").pass, true);
    assert.equal(score("maxWords", "one two three four", "3").pass, false);
    assert.equal(score("maxWords", "", "3").pass, false);
  });
});

describe("mock provider", () => {
  it("is deterministic", () => {
    assert.equal(hash01("same"), hash01("same"));
    assert.notEqual(hash01("a"), hash01("b"));
  });
  it("rewards clearer prompts", () => {
    for (const p of PRESETS) assert.ok(promptQuality(p.b.template) > promptQuality(p.a.template), p.id);
  });
  it("stops when the signal aborts", async () => {
    const ctrl = new AbortController();
    const pending = mockComplete({
      model,
      prompt: "p",
      template: "t",
      input: "i",
      expected: "e",
      scorer: "exact",
      signal: ctrl.signal,
    });
    ctrl.abort();
    await assert.rejects(pending, /aborted/);
  });
});

describe("runComparison", () => {
  const perfect: CompleteFn = async ({ expected }) => ({ text: expected, inputTokens: 100, outputTokens: 10 });

  it("runs every case on both sides and reports each result once", async () => {
    const seen: CaseResult[] = [];
    const results = await runComparison(request(twoCases), {
      complete: perfect,
      onEvent: (e) => e.type === "result" && seen.push(e.result),
    });
    assert.equal(results.length, 4);
    assert.equal(seen.length, 4);
    assert.ok(results.every((r) => r.pass));
    assert.equal(buildTasks(request(twoCases)).length, 4);
  });

  it("uses provider token counts to work out cost", async () => {
    const [r] = await runComparison(request(twoCases.slice(0, 1)), { complete: perfect });
    assert.equal(r.inputTokens, 100);
    assert.ok(Math.abs(r.costUsd - (100 * 0.15 + 10 * 0.6) / 1_000_000) < 1e-12);
  });

  it("never runs more calls at once than the concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    const slow: CompleteFn = async ({ expected }) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { text: expected };
    };
    const cases = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, input: "x", expected: "y", scorer: "exact" as const }));
    await runComparison(request(cases), { complete: slow, concurrency: 3 });
    assert.ok(peak <= 3, `peak was ${peak}`);
    assert.ok(peak > 1);
  });

  it("retries retryable errors and then succeeds", async () => {
    let calls = 0;
    const flaky: CompleteFn = async ({ expected }) => {
      calls++;
      if (calls === 1) throw new ProviderError("rate limited", true);
      return { text: expected };
    };
    const [r] = await runComparison(request(twoCases.slice(0, 1)), { complete: flaky, concurrency: 1, maxAttempts: 2 });
    assert.equal(r.pass, true);
    assert.equal(r.error, undefined);
    assert.ok(calls >= 2);
  });

  it("does not retry errors that are not retryable", async () => {
    let calls = 0;
    const broken: CompleteFn = async () => {
      calls++;
      throw new ProviderError("bad key", false);
    };
    const results = await runComparison(request(twoCases.slice(0, 1)), { complete: broken, maxAttempts: 3 });
    assert.equal(calls, 2); // one call for A and one for B, no retries
    assert.ok(results.every((r) => r.error === "bad key" && !r.pass));
  });

  it("times out a call that hangs", async () => {
    const hang: CompleteFn = ({ signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    const results = await runComparison(request(twoCases.slice(0, 1)), { complete: hang, timeoutMs: 20, maxAttempts: 1 });
    assert.ok(results.every((r) => r.error === "Timed out after 20 ms"));
  });

  it("stops starting new calls after the signal aborts", async () => {
    const ctrl = new AbortController();
    let calls = 0;
    const complete: CompleteFn = async ({ expected }) => {
      calls++;
      ctrl.abort();
      return { text: expected };
    };
    const cases = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, input: "x", expected: "y", scorer: "exact" as const }));
    const results = await runComparison(request(cases), { complete, concurrency: 1, signal: ctrl.signal });
    assert.equal(calls, 1);
    assert.equal(results.length, 1);
  });

  it("reports an unknown model as an error result instead of throwing", async () => {
    const req = request(twoCases.slice(0, 1));
    req.a.model = "nope";
    const results = await runComparison(req, { complete: perfect });
    assert.equal(results.find((r) => r.side === "A")?.error, 'Unknown model "nope"');
    assert.equal(results.find((r) => r.side === "B")?.pass, true);
  });
});

describe("summaries", () => {
  it("computes pass rate, latency percentiles and cost", () => {
    const rs = [
      result("A", "c1", true, { latencyMs: 100, costUsd: 0.002 }),
      result("A", "c2", false, { latencyMs: 300, costUsd: 0.004 }),
      result("A", "c3", false, { error: "boom", latencyMs: 9999, costUsd: 0 }),
    ];
    const s = summarize(rs, "A", 4);
    assert.equal(s.total, 4);
    assert.equal(s.completed, 3);
    assert.equal(s.passed, 1);
    assert.equal(s.passRate, 0.25);
    assert.equal(s.errors, 1);
    assert.equal(s.avgLatencyMs, 200); // the errored call is left out
    assert.equal(s.p95LatencyMs, 300);
    assert.ok(Math.abs(s.totalCostUsd - 0.006) < 1e-12);
  });

  it("handles empty results", () => {
    const s = summarize([], "B", 0);
    assert.equal(s.passRate, 0);
    assert.equal(s.avgLatencyMs, 0);
  });

  it("percentile uses nearest rank", () => {
    assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95), 10);
    assert.equal(percentile([1, 2, 3, 4], 0.5), 2);
    assert.equal(percentile([], 0.95), 0);
  });

  it("finds the winner and which cases changed", () => {
    const rs = [
      result("A", "c1", true),
      result("B", "c1", true),
      result("A", "c2", false),
      result("B", "c2", true),
      result("A", "c3", true),
      result("B", "c3", false),
      result("A", "c4", false),
      result("B", "c4", true),
    ];
    const c = compare(rs, 4);
    assert.equal(c.winner, "B");
    assert.equal(c.delta, 25);
    assert.deepEqual(c.fixed, ["c2", "c4"]);
    assert.deepEqual(c.regressed, ["c3"]);
  });

  it("calls equal pass rates a tie", () => {
    const c = compare([result("A", "c1", true), result("B", "c1", true)], 1);
    assert.equal(c.winner, "tie");
    assert.equal(c.delta, 0);
  });
});

describe("demo presets", () => {
  for (const preset of PRESETS) {
    it(`${preset.title}: the better prompt wins with the simulated model`, async () => {
      const results = await runComparison(
        { a: preset.a, b: preset.b, cases: preset.cases },
        { complete: mockComplete, concurrency: 8 },
      );
      const c = compare(results, preset.cases.length);
      assert.equal(c.winner, "B", `A ${c.a.passed}/${c.a.total}, B ${c.b.passed}/${c.b.total}`);
      assert.ok(c.delta >= 30, `delta was only ${c.delta}`);
      assert.equal(c.a.errors + c.b.errors, 0);
    });
  }
});

describe("rate limiter", () => {
  it("allows up to the limit inside the window, then blocks, then recovers", () => {
    const key = `k-${Math.random()}`;
    assert.equal(allow(key, 2, 1000, 0), true);
    assert.equal(allow(key, 2, 1000, 10), true);
    assert.equal(allow(key, 2, 1000, 20), false);
    assert.equal(allow(key, 2, 1000, 1500), true);
  });
});
