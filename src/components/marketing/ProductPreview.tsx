"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { Towers3D } from "@/components/three/Towers3D";
import { mockComplete } from "@/lib/engine/providers/mock";
import { compare, runComparison } from "@/lib/engine/runner";
import type { CaseResult, Side } from "@/lib/engine/types";
import { PRESETS } from "@/lib/presets";
import { SIDE_STYLE } from "@/lib/side";

const preset = PRESETS[0];

function Chip({ side, result }: { side: Side; result?: CaseResult }) {
  const t = useT();
  const state = !result ? "waiting" : result.pass ? "pass" : "fail";
  const label = t(state === "waiting" ? "preview.waiting" : state === "pass" ? "preview.pass" : "preview.fail");
  const tone = state === "pass" ? "text-pass" : state === "fail" ? "text-fail" : "text-mute";

  return (
    <span className={`inline-flex min-w-[3.6rem] items-center justify-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs font-bold ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${SIDE_STYLE[side].bg}`} aria-hidden="true" />
      <span aria-hidden="true">{state === "waiting" ? "·" : state === "pass" ? "✓" : "✗"}</span>
      <span className="sr-only">
        {side}: {label}
      </span>
    </span>
  );
}

/**
 * A small, real Prompt Lab running in the page. It uses the same engine as the lab with the simulated
 * demo model, entirely in the browser, so it makes no network calls and costs nothing.
 * The 3D view only loads when someone asks for it.
 */
export function ProductPreview() {
  const t = useT();
  const [results, setResults] = useState<CaseResult[]>([]);
  const [running, setRunning] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const total = preset.cases.length;
  const finished = !running && results.length === total * 2;
  const comparison = useMemo(() => compare(results, total), [results, total]);
  const byKey = useMemo(() => new Map(results.map((r) => [`${r.side}:${r.caseId}`, r])), [results]);
  const caseIds = useMemo(() => preset.cases.map((c) => c.id), []);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const collected: CaseResult[] = [];
    setResults([]);
    setRunning(true);
    try {
      await runComparison(
        { a: preset.a, b: preset.b, cases: preset.cases },
        {
          complete: mockComplete,
          concurrency: 3,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type !== "result") return;
            collected.push(event.result);
            setResults([...collected]);
          },
        },
      );
    } finally {
      if (abortRef.current === controller) setRunning(false);
    }
  };

  const verdict =
    comparison.winner === "tie"
      ? t("preview.tie")
      : t("preview.winner", { side: comparison.winner, points: Math.abs(Math.round(comparison.delta)) });

  return (
    <div className="rounded-2xl border border-line bg-panel/80 shadow-[0_30px_80px_-30px_rgba(84,87,232,0.55)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="font-bold">{t("preview.title")}</p>
        <p className="text-right text-xs text-mute">{t("preview.note")}</p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {(
          [
            { side: "A", label: t("preview.promptA"), prompt: preset.a.template, summary: comparison.a },
            { side: "B", label: t("preview.promptB"), prompt: preset.b.template, summary: comparison.b },
          ] as const
        ).map(({ side, label, prompt, summary }) => (
          <section key={side} aria-label={label} className={`rounded-lg border-t-2 bg-bg/70 p-3 ${SIDE_STYLE[side].topRule}`}>
            <h3 className={`text-sm font-bold ${SIDE_STYLE[side].text}`}>{label}</h3>
            <p className="mt-1.5 line-clamp-4 font-mono text-[0.7rem] leading-relaxed text-mute">{prompt}</p>
            <p className="mt-2 h-5 text-sm font-bold" aria-live="polite">
              {finished ? t("preview.passed", { count: summary.passed, total: summary.total }) : ""}
            </p>
          </section>
        ))}
      </div>

      {show3d ? (
        <div className="mx-4 h-64 overflow-hidden rounded-lg border border-line">
          <Towers3D caseIds={caseIds} results={results} />
        </div>
      ) : (
        <ol className="mx-4 divide-y divide-line/60 rounded-lg border border-line">
          {preset.cases.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-1.5">
              <span className="w-4 font-mono text-xs text-mute">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-mute">
                <span className="sr-only">{t("preview.case")}: </span>
                {c.input}
              </span>
              <Chip side="A" result={byKey.get(`A:${c.id}`)} />
              <Chip side="B" result={byKey.get(`B:${c.id}`)} />
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
        <button type="button" onClick={run} disabled={running} className="btn btn-primary btn-sm">
          {running ? t("preview.running") : results.length ? t("preview.reset") : t("preview.run")}
        </button>
        <button
          type="button"
          onClick={() => setShow3d((v) => !v)}
          aria-pressed={show3d}
          className="text-sm font-semibold text-mute underline underline-offset-4 hover:text-fg"
        >
          {show3d ? t("preview.hide3d") : t("preview.view3d")}
        </button>
        <Link href="/demo" className="ml-auto text-sm font-semibold text-fg underline underline-offset-4">
          {t("preview.openDemo")}
        </Link>
      </div>

      <p role="status" className="min-h-6 px-4 pb-4 text-sm font-bold">
        {finished ? verdict : ""}
      </p>
    </div>
  );
}
