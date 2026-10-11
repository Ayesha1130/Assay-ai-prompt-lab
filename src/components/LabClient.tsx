"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { MODELS, getModel } from "@/lib/engine/pricing";
import type { RunRequest, TestCase, Variant } from "@/lib/engine/types";
import { PRESETS, getPreset, type Preset } from "@/lib/presets";
import { ApiError, getRun, saveRun } from "@/lib/store";
import { PAID_MAX_CASES } from "@/lib/usage";
import { useRun } from "@/lib/useRun";

import { CasesEditor } from "./CasesEditor";
import { ResultsPanel } from "./ResultsPanel";
import { VariantEditor } from "./VariantEditor";

interface Draft {
  a: Variant;
  b: Variant;
  cases: TestCase[];
}

function fromPreset(p: Preset): Draft {
  return { a: { ...p.a }, b: { ...p.b }, cases: p.cases.map((c) => ({ ...c })) };
}

const BLANK: Draft = {
  a: { name: "Prompt A", model: "demo-sim", template: "Answer briefly: {{input}}" },
  b: { name: "Prompt B", model: "demo-sim", template: "You are a careful assistant. Answer precisely: {{input}}" },
  cases: [{ id: "c1", input: "", expected: "", scorer: "contains" }],
};

const DEMO_MODELS = MODELS.filter((m) => m.provider === "mock");

const NEEDS_EXPECTED = new Set(["exact", "contains", "regex", "maxWords"]);

/**
 * "demo": for visitors. Only the simulated model, nothing is saved, no paid API calls.
 * "full": for signed-in users. Real models (with server-side limits) and results saved to the account.
 */
export function LabClient({ mode = "full" }: { mode?: "demo" | "full" }) {
  const t = useT();
  const demo = mode === "demo";
  const params = useSearchParams();
  const startBlank = !demo && params.get("preset") === "blank";

  const [presetId, setPresetId] = useState<string>(startBlank ? "custom" : PRESETS[0].id);
  const [draft, setDraft] = useState<Draft>(() => (startBlank ? BLANK : fromPreset(PRESETS[0])));
  const [lastRequest, setLastRequest] = useState<RunRequest | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ranOnce, setRanOnce] = useState(false);
  const { status, results, error, start, cancel, reset } = useRun();
  const resultsRef = useRef<HTMLDivElement>(null);

  const fromId = demo ? null : params.get("from");
  useEffect(() => {
    if (!fromId) return;
    let live = true;
    getRun(fromId)
      .then((run) => {
        if (!live || !run) return;
        setDraft({ a: run.request.a, b: run.request.b, cases: run.request.cases });
        setPresetId("custom");
        setLastRequest(null);
        reset();
      })
      .catch(() => {
        // The experiment could not be loaded. The lab keeps its current example.
      });
    return () => {
      live = false;
    };
  }, [fromId, reset]);

  const draftRequest = useMemo<RunRequest>(() => ({ a: draft.a, b: draft.b, cases: draft.cases }), [draft]);
  const shown = lastRequest ?? draftRequest;
  const running = status === "running";

  const problem = useMemo(() => {
    if (!draft.a.template.trim() || !draft.b.template.trim()) return "Write text for both prompts.";
    if (draft.cases.length === 0) return "Add at least one test case.";
    if (draft.cases.some((c) => !c.input.trim())) return "Every test case needs an input.";
    if (draft.cases.some((c) => NEEDS_EXPECTED.has(c.scorer) && !c.expected.trim())) {
      return "Fill in the expected answer for each test case.";
    }
    const paid = [draft.a, draft.b].some((v) => getModel(v.model)?.provider === "openai");
    if (paid && draft.cases.length > PAID_MAX_CASES) {
      return `Real models are limited to ${PAID_MAX_CASES} test cases per run. Remove some cases or use the demo model.`;
    }
    return null;
  }, [draft]);

  const usesDemoOnly = draft.a.model === "demo-sim" && draft.b.model === "demo-sim";

  const choosePreset = (id: string) => {
    setPresetId(id);
    setDraft(fromPreset(getPreset(id)));
    setLastRequest(null);
    setSaved(false);
    setSaveError(null);
    reset();
  };

  const run = async () => {
    if (problem || running) return;
    const request: RunRequest = {
      a: { ...draft.a },
      b: { ...draft.b },
      cases: draft.cases.map((c) => ({ ...c })),
    };
    setLastRequest(request);
    setSaved(false);
    setSaveError(null);
    setRanOnce(true);

    if (window.matchMedia("(max-width: 1279px)").matches) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultsRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }

    const finished = await start(request);
    if (finished && !demo) {
      try {
        await saveRun({ request, results: finished });
        setSaved(true);
      } catch (err) {
        setSaveError(err instanceof ApiError ? err.message : "The result could not be saved to your account.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-[88rem] px-5 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{demo ? "Demo lab" : "Lab"}</h1>
          <p className="mt-2 max-w-[52ch] text-mute">
            Write two prompts, add test cases, and run both.{" "}
            {demo || usesDemoOnly
              ? "The demo model is simulated and free."
              : "Real models run on the server and count toward your hourly and daily allowance."}{" "}
            {demo ? "Nothing here is saved." : usesDemoOnly ? "Choose a gpt model in a prompt to compare real ones." : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="preset" className="mb-1.5 block text-sm font-semibold">
              Start from an example
            </label>
            <select id="preset" className="field min-w-56" value={presetId} onChange={(e) => choosePreset(e.target.value)} disabled={running}>
              {presetId === "custom" ? <option value="custom">Your own prompts</option> : null}
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={run} disabled={Boolean(problem) || running} className="btn btn-primary h-[2.6rem]">
            {running ? "Running" : "Run comparison"}
          </button>
        </div>
      </header>

      <p role="status" className="mt-3 min-h-5 text-sm text-mute">
        {problem ? problem : `${draft.cases.length} ${draft.cases.length === 1 ? "case" : "cases"} on 2 prompts is ${draft.cases.length * 2} answers.`}
      </p>

      <div className="mt-6 grid gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-14">
        <div className="space-y-8">
          <VariantEditor side="A" value={draft.a} onChange={(a) => setDraft((d) => ({ ...d, a }))} disabled={running} models={demo ? DEMO_MODELS : undefined} />
          <VariantEditor side="B" value={draft.b} onChange={(b) => setDraft((d) => ({ ...d, b }))} disabled={running} models={demo ? DEMO_MODELS : undefined} />
          <CasesEditor cases={draft.cases} onChange={(cases) => setDraft((d) => ({ ...d, cases }))} disabled={running} />
        </div>

        <div ref={resultsRef} className="scroll-mt-24 xl:sticky xl:top-24 xl:max-h-[calc(100svh-7rem)] xl:self-start xl:overflow-y-auto xl:pr-2">
          <ResultsPanel request={shown} results={results} status={status} error={error} saved={saved} saveError={saveError} onCancel={cancel} />
          {demo && ranOnce && status === "done" ? (
            <aside className="mt-8 rounded-2xl border border-accent/50 bg-accent/10 p-5">
              <h2 className="text-lg font-extrabold">{t("demo.ctaTitle")}</h2>
              <p className="mt-1 text-sm text-mute">{t("demo.ctaBody")}</p>
              <Link href="/signup" className="btn btn-primary mt-4">
                {t("demo.ctaButton")}
              </Link>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
