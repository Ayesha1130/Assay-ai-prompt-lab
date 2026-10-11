export type ScorerKind = "exact" | "contains" | "regex" | "json" | "maxWords";
export type Side = "A" | "B";

export interface TestCase {
  id: string;
  input: string;
  expected: string;
  scorer: ScorerKind;
}

export interface Variant {
  name: string;
  template: string;
  model: string;
}

export interface RunRequest {
  a: Variant;
  b: Variant;
  cases: TestCase[];
}

export interface CaseResult {
  side: Side;
  caseId: string;
  output: string;
  pass: boolean;
  score: number;
  note?: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error?: string;
}

export interface SideSummary {
  side: Side;
  total: number;
  completed: number;
  passed: number;
  passRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalCostUsd: number;
  avgCostUsd: number;
  errors: number;
}

export interface Comparison {
  a: SideSummary;
  b: SideSummary;
  /** Pass-rate difference in percentage points (B minus A). */
  delta: number;
  winner: Side | "tie";
  /** Case ids that failed on A but pass on B. */
  fixed: string[];
  /** Case ids that passed on A but fail on B. */
  regressed: string[];
}

export interface SavedRun {
  id: string;
  createdAt: string;
  /** Optional title. The app falls back to "A name vs B name". */
  name?: string;
  request: RunRequest;
  results: CaseResult[];
}

export type RunEvent =
  | { type: "result"; result: CaseResult }
  | { type: "done" }
  | { type: "error"; message: string };

export interface CompleteArgs {
  model: import("./pricing.ts").ModelInfo;
  prompt: string;
  template: string;
  input: string;
  expected: string;
  scorer: ScorerKind;
  signal: AbortSignal;
}

export interface Completion {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export type CompleteFn = (args: CompleteArgs) => Promise<Completion>;
