import { ProviderError } from "./errors.ts";
import { costUsd, estimateTokens, getModel } from "./pricing.ts";
import { score } from "./scorers.ts";
import type {
  CaseResult,
  CompleteFn,
  Comparison,
  RunEvent,
  RunRequest,
  Side,
  SideSummary,
  TestCase,
  Variant,
} from "./types.ts";
import { clamp, sleep } from "./util.ts";

export const LIMITS = {
  maxCases: 25,
  maxTemplate: 4000,
  maxInput: 2000,
  maxExpected: 500,
  maxOutput: 4000,
} as const;

const PLACEHOLDER = "{{input}}";

/** Put the test input into the prompt. Without a placeholder the input is appended. */
export function fillTemplate(template: string, input: string): string {
  if (template.includes(PLACEHOLDER)) return template.split(PLACEHOLDER).join(input);
  return `${template.trimEnd()}\n\n${input}`;
}

export interface Task {
  side: Side;
  variant: Variant;
  testCase: TestCase;
}

/** One task per case and side, ordered so A and B for the same case finish close together. */
export function buildTasks(req: RunRequest): Task[] {
  const tasks: Task[] = [];
  for (const testCase of req.cases) {
    tasks.push({ side: "A", variant: req.a, testCase });
    tasks.push({ side: "B", variant: req.b, testCase });
  }
  return tasks;
}

export interface RunOptions {
  complete: CompleteFn;
  /** How many model calls run at once. */
  concurrency?: number;
  /** Per call, in milliseconds. */
  timeoutMs?: number;
  /** Total tries per call, including the first. Only retryable errors are retried. */
  maxAttempts?: number;
  signal?: AbortSignal;
  onEvent?: (event: RunEvent) => void;
}

interface CallOptions {
  complete: CompleteFn;
  timeoutMs: number;
  maxAttempts: number;
  signal?: AbortSignal;
}

function failed(task: Task, error: string, latencyMs: number): CaseResult {
  return {
    side: task.side,
    caseId: task.testCase.id,
    output: "",
    pass: false,
    score: 0,
    latencyMs,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    error,
  };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function runTask(task: Task, opts: CallOptions): Promise<CaseResult> {
  const { variant, testCase } = task;
  const { complete, timeoutMs, maxAttempts, signal } = opts;

  const model = getModel(variant.model);
  if (!model) return failed(task, `Unknown model "${variant.model}"`, 0);

  const prompt = fillTemplate(variant.template, testCase.input);
  const started = performance.now();
  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) return failed(task, "Cancelled", performance.now() - started);

    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const completion = await complete({
        model,
        prompt,
        template: variant.template,
        input: testCase.input,
        expected: testCase.expected,
        scorer: testCase.scorer,
        signal: ctrl.signal,
      });

      const latencyMs = performance.now() - started;
      const output = completion.text.slice(0, LIMITS.maxOutput);
      const outcome = score(testCase.scorer, output, testCase.expected);
      const inputTokens = completion.inputTokens ?? estimateTokens(prompt);
      const outputTokens = completion.outputTokens ?? estimateTokens(output);

      return {
        side: task.side,
        caseId: testCase.id,
        output,
        pass: outcome.pass,
        score: outcome.score,
        note: outcome.note,
        latencyMs,
        inputTokens,
        outputTokens,
        costUsd: costUsd(model, inputTokens, outputTokens),
      };
    } catch (err) {
      if (signal?.aborted) return failed(task, "Cancelled", performance.now() - started);

      const timedOut = ctrl.signal.aborted;
      lastError = timedOut ? `Timed out after ${timeoutMs} ms` : messageOf(err);
      const retryable = timedOut || (err instanceof ProviderError && err.retryable);
      if (!retryable || attempt === maxAttempts) break;

      try {
        await sleep(250 * attempt, signal);
      } catch {
        return failed(task, "Cancelled", performance.now() - started);
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  return failed(task, lastError, performance.now() - started);
}

/**
 * Run both prompts over every test case. Results are reported through onEvent as they
 * finish and returned in task order. Stops starting new calls once the signal aborts.
 */
export async function runComparison(req: RunRequest, opts: RunOptions): Promise<CaseResult[]> {
  const tasks = buildTasks(req);
  const results: (CaseResult | undefined)[] = new Array(tasks.length).fill(undefined);
  const callOpts: CallOptions = {
    complete: opts.complete,
    timeoutMs: opts.timeoutMs ?? 30_000,
    maxAttempts: opts.maxAttempts ?? 2,
    signal: opts.signal,
  };
  const concurrency = clamp(opts.concurrency ?? 4, 1, 16);

  let next = 0;
  const worker = async () => {
    while (!opts.signal?.aborted) {
      const i = next++;
      if (i >= tasks.length) return;
      const result = await runTask(tasks[i], callOpts);
      results[i] = result;
      opts.onEvent?.({ type: "result", result });
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results.filter((r): r is CaseResult => r !== undefined);
}

/** Nearest-rank percentile of an ascending list. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[clamp(idx, 0, sorted.length - 1)];
}

export function summarize(results: CaseResult[], side: Side, total: number): SideSummary {
  const mine = results.filter((r) => r.side === side);
  const answered = mine.filter((r) => !r.error);
  const latencies = answered.map((r) => r.latencyMs).sort((x, y) => x - y);
  const passed = mine.filter((r) => r.pass).length;
  const totalCostUsd = mine.reduce((sum, r) => sum + r.costUsd, 0);

  return {
    side,
    total,
    completed: mine.length,
    passed,
    passRate: total > 0 ? passed / total : 0,
    avgLatencyMs: latencies.length ? latencies.reduce((s, v) => s + v, 0) / latencies.length : 0,
    p95LatencyMs: percentile(latencies, 0.95),
    totalCostUsd,
    avgCostUsd: mine.length ? totalCostUsd / mine.length : 0,
    errors: mine.length - answered.length,
  };
}

export function compare(results: CaseResult[], totalCases: number): Comparison {
  const a = summarize(results, "A", totalCases);
  const b = summarize(results, "B", totalCases);
  const delta = (b.passRate - a.passRate) * 100;

  const key = (side: Side) => {
    const map = new Map<string, CaseResult>();
    for (const r of results) if (r.side === side) map.set(r.caseId, r);
    return map;
  };
  const byA = key("A");
  const byB = key("B");

  const fixed: string[] = [];
  const regressed: string[] = [];
  for (const [id, ra] of byA) {
    const rb = byB.get(id);
    if (!rb) continue;
    if (!ra.pass && rb.pass) fixed.push(id);
    if (ra.pass && !rb.pass) regressed.push(id);
  }

  const winner: Comparison["winner"] = Math.abs(delta) < 1e-6 ? "tie" : delta > 0 ? "B" : "A";
  return { a, b, delta, winner, fixed, regressed };
}
