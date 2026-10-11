"use client";

import Link from "next/link";
import { useMemo } from "react";

import { compare } from "@/lib/engine/runner";
import { SCORER_LABELS } from "@/lib/engine/scorers";
import type { CaseResult, Comparison, RunRequest, Side, TestCase, Variant } from "@/lib/engine/types";
import { ms, pct, usd } from "@/lib/format";
import { SIDE_STYLE } from "@/lib/side";
import type { RunStatus } from "@/lib/useRun";

import { Towers3D } from "./three/Towers3D";

interface Props {
  request: RunRequest;
  results: CaseResult[];
  status: RunStatus;
  error?: string | null;
  saved?: boolean;
  saveError?: string | null;
  onCancel?: () => void;
}

function verdict(c: Comparison, a: Variant, b: Variant): { title: string; tone: string; detail: string } {
  if (c.winner === "tie") {
    return {
      title: "Dead heat",
      tone: "text-fg",
      detail: `Both prompts passed ${c.a.passed} of ${c.a.total}. Look at speed and cost to break the tie.`,
    };
  }
  const winner = c.winner === "A" ? a : b;
  const points = Math.abs(Math.round(c.delta));
  return {
    title: `${winner.name} wins by ${points} ${points === 1 ? "point" : "points"}`,
    tone: SIDE_STYLE[c.winner].text,
    detail: `Compared with prompt A, prompt B fixed ${c.fixed.length} ${c.fixed.length === 1 ? "case" : "cases"} and broke ${c.regressed.length}.`,
  };
}

function Outcome({ side, result }: { side: Side; result?: CaseResult }) {
  const state = !result ? "waiting" : result.error ? "error" : result.pass ? "pass" : "fail";
  const label = { waiting: "Waiting", error: "Error", pass: "Pass", fail: "Fail" }[state];
  const symbol = { waiting: "…", error: "!", pass: "✓", fail: "✗" }[state];
  const tone = { waiting: "text-mute", error: "text-fail", pass: "text-pass", fail: "text-fail" }[state];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-bold ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${SIDE_STYLE[side].bg}`} aria-hidden="true" />
      <span className="sr-only">Prompt {side}:</span>
      <span aria-hidden="true">{symbol}</span> {label}
    </span>
  );
}

function Answer({ side, result }: { side: Side; result?: CaseResult }) {
  return (
    <div className="min-w-0">
      <h4 className={`text-sm font-bold ${SIDE_STYLE[side].text}`}>Prompt {side} answered</h4>
      {!result ? (
        <p className="mt-2 text-sm text-mute">Waiting for this answer.</p>
      ) : result.error ? (
        <p role="alert" className="mt-2 text-sm text-fail">
          {result.error}
        </p>
      ) : (
        <>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-bg p-3 font-mono text-xs leading-relaxed">
            {result.output || "(empty answer)"}
          </pre>
          {result.note ? <p className="mt-2 text-xs text-fail">{result.note}</p> : null}
          <p className="mt-2 text-xs text-mute">
            {ms(result.latencyMs)}, {result.inputTokens + result.outputTokens} tokens, {usd(result.costUsd)}
          </p>
        </>
      )}
    </div>
  );
}

function Scoreboard({ comparison, a, b, final }: { comparison: Comparison; a: Variant; b: Variant; final: boolean }) {
  const sides: { side: Side; variant: Variant; summary: Comparison["a"] }[] = [
    { side: "A", variant: a, summary: comparison.a },
    { side: "B", variant: b, summary: comparison.b },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {sides.map(({ side, variant, summary }) => {
        const isWinner = final && comparison.winner === side;
        return (
          <section key={side} aria-label={`Prompt ${side} results`} className={`border-t-4 ${SIDE_STYLE[side].topRule} bg-panel/70 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 truncate font-bold">
                <span className={SIDE_STYLE[side].text}>{side}</span> {variant.name}
              </h3>
              {isWinner ? <span className="shrink-0 rounded-full bg-fg px-2.5 py-0.5 text-xs font-bold text-bg">Winner</span> : null}
            </div>
            <p className="mt-3 text-5xl font-extrabold leading-none tracking-[-0.04em]">{pct(summary.passRate)}</p>
            <p className="mt-1 text-sm text-mute">
              passed {summary.passed} of {summary.total}
            </p>
            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
              <dt className="text-mute">Typical speed</dt>
              <dd className="font-mono">{ms(summary.avgLatencyMs)}</dd>
              <dt className="text-mute">Slowest 5%</dt>
              <dd className="font-mono">{ms(summary.p95LatencyMs)}</dd>
              <dt className="text-mute">Cost this run</dt>
              <dd className="font-mono">{usd(summary.totalCostUsd)}</dd>
              {summary.errors > 0 ? (
                <>
                  <dt className="text-fail">Calls that failed</dt>
                  <dd className="font-mono text-fail">{summary.errors}</dd>
                </>
              ) : null}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function CaseRow({ index, testCase, a, b }: { index: number; testCase: TestCase; a?: CaseResult; b?: CaseResult }) {
  return (
    <li>
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[1.5rem_minmax(0,1fr)_auto_auto_1rem] items-center gap-3 py-3 text-left [&::-webkit-details-marker]:hidden">
          <span className="font-mono text-xs text-mute">{index + 1}</span>
          <span className="truncate text-sm">{testCase.input || "(empty input)"}</span>
          <Outcome side="A" result={a} />
          <Outcome side="B" result={b} />
          <span className="text-mute transition-transform group-open:rotate-90" aria-hidden="true">
            ▸
          </span>
        </summary>
        <div className="pb-5 pl-9">
          <p className="text-xs text-mute">
            {SCORER_LABELS[testCase.scorer]}
            {testCase.expected ? (
              <>
                {": "}
                <span className="font-mono text-fg">{testCase.expected}</span>
              </>
            ) : null}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Answer side="A" result={a} />
            <Answer side="B" result={b} />
          </div>
        </div>
      </details>
    </li>
  );
}

export function ResultsPanel({ request, results, status, error, saved, saveError, onCancel }: Props) {
  const total = request.cases.length;
  const expectedAnswers = total * 2;
  const comparison = useMemo(() => compare(results, total), [results, total]);
  const caseIds = useMemo(() => request.cases.map((c) => c.id), [request.cases]);
  const byKey = useMemo(() => {
    const map = new Map<string, CaseResult>();
    for (const r of results) map.set(`${r.side}:${r.caseId}`, r);
    return map;
  }, [results]);

  const running = status === "running";
  const finished = status === "done";
  const hasResults = results.length > 0;
  const result = finished ? verdict(comparison, request.a, request.b) : null;

  return (
    <section aria-label="Results" className="min-w-0">
      <div aria-live="polite">
        {status === "idle" && !hasResults ? (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Ready when you are</h2>
            <p className="mt-2 text-mute">
              {total} {total === 1 ? "case" : "cases"} on 2 prompts is {expectedAnswers} answers. Press Run comparison to see which prompt wins.
            </p>
          </>
        ) : null}

        {running ? (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {results.length} of {expectedAnswers} answers in
            </h2>
            <div
              role="progressbar"
              aria-label="Run progress"
              aria-valuemin={0}
              aria-valuemax={expectedAnswers}
              aria-valuenow={results.length}
              className="mt-4 h-2 overflow-hidden rounded-full bg-raised"
            >
              <div
                className="progress-stripes h-full rounded-full bg-fg transition-[width] duration-300"
                style={{ width: `${expectedAnswers ? (results.length / expectedAnswers) * 100 : 0}%` }}
              />
            </div>
            {onCancel ? (
              <button type="button" onClick={onCancel} className="mt-4 text-sm font-semibold text-mute underline underline-offset-4 hover:text-fg">
                Stop the run
              </button>
            ) : null}
          </>
        ) : null}

        {result ? (
          <>
            <h2 className={`text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-4xl ${result.tone}`}>{result.title}</h2>
            <p className="mt-2 text-mute">{result.detail}</p>
            {total < 20 ? (
              <p className="mt-2 text-sm text-mute">
                With {total} {total === 1 ? "case" : "cases"} this is a hint, not proof. Add more cases before you decide.
              </p>
            ) : null}
            {saveError ? (
              <p role="alert" className="mt-2 text-sm text-fail">
                {saveError}
              </p>
            ) : null}
            {saved ? (
              <p className="mt-2 text-sm text-mute">
                Saved to your account.{" "}
                <Link href="/runs" className="font-semibold text-fg underline underline-offset-4">
                  See all runs
                </Link>
              </p>
            ) : null}
          </>
        ) : null}

        {status === "cancelled" ? (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Stopped early</h2>
            <p className="mt-2 text-mute">
              {results.length} of {expectedAnswers} answers came back. This run was not saved.
            </p>
          </>
        ) : null}
      </div>

      {status === "error" ? (
        <div role="alert" className="rounded-lg border border-fail/60 bg-fail/10 p-4">
          <h2 className="font-bold text-fail">The run stopped</h2>
          <p className="mt-1 text-sm">{error ?? "Something went wrong."}</p>
          {hasResults ? <p className="mt-1 text-sm text-mute">{results.length} answers arrived before it stopped.</p> : null}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="h-[300px] overflow-hidden rounded-xl border border-line sm:h-[340px]">
          <Towers3D caseIds={caseIds} results={results} />
        </div>
        <p className="mt-2 text-xs text-mute">
          Two columns per test case: <span className="font-semibold text-side-a">marigold is prompt A</span>,{" "}
          <span className="font-semibold text-side-b">orchid is prompt B</span>. Tall means it passed. Short with a coral cap means it failed. Drag to turn.
        </p>
      </div>

      {hasResults ? (
        <div className="mt-8">
          <Scoreboard comparison={comparison} a={request.a} b={request.b} final={finished} />
        </div>
      ) : null}

      {hasResults ? (
        <div className="mt-10">
          <h3 className="text-xl font-extrabold tracking-tight">Case by case</h3>
          <p className="mt-1 text-sm text-mute">Open a row to read both answers.</p>
          <ol className="mt-3 divide-y divide-line/70 border-y border-line/70">
            {request.cases.map((c, i) => (
              <CaseRow key={c.id} index={i} testCase={c} a={byKey.get(`A:${c.id}`)} b={byKey.get(`B:${c.id}`)} />
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
