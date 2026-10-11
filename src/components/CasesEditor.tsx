"use client";

import { LIMITS } from "@/lib/engine/runner";
import { SCORER_HINTS, SCORER_LABELS } from "@/lib/engine/scorers";
import type { ScorerKind, TestCase } from "@/lib/engine/types";
import { uid } from "@/lib/engine/util";

interface Props {
  cases: TestCase[];
  onChange: (next: TestCase[]) => void;
  disabled?: boolean;
}

const SCORERS = Object.keys(SCORER_LABELS) as ScorerKind[];

export function CasesEditor({ cases, onChange, disabled }: Props) {
  const update = (index: number, patch: Partial<TestCase>) =>
    onChange(cases.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const remove = (index: number) => onChange(cases.filter((_, i) => i !== index));

  const add = () => onChange([...cases, { id: uid(), input: "", expected: "", scorer: cases.at(-1)?.scorer ?? "exact" }]);

  const full = cases.length >= LIMITS.maxCases;

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Test cases</legend>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight">Test cases</h2>
        <span className="text-sm text-mute">
          {cases.length} of {LIMITS.maxCases}
        </span>
      </div>

      {cases.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line p-5 text-sm text-mute">
          No test cases yet. Add one with an input and the answer you expect.
        </p>
      ) : (
        <ol className="mt-4">
          {cases.map((c, i) => (
            <li key={c.id} className="grid gap-3 border-t border-line/70 py-4 md:grid-cols-[1.5fr_1fr_9.5rem_auto] md:items-start">
              <div>
                <label htmlFor={`case-${c.id}-input`} className="mb-1 block text-xs font-semibold text-mute md:sr-only">
                  Input for case {i + 1}
                </label>
                <textarea
                  id={`case-${c.id}-input`}
                  className="field"
                  rows={2}
                  maxLength={LIMITS.maxInput}
                  placeholder={`Input for case ${i + 1}`}
                  value={c.input}
                  onChange={(e) => update(i, { input: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor={`case-${c.id}-expected`} className="mb-1 block text-xs font-semibold text-mute md:sr-only">
                  Expected for case {i + 1}
                </label>
                <input
                  id={`case-${c.id}-expected`}
                  className="field"
                  maxLength={LIMITS.maxExpected}
                  placeholder={SCORER_HINTS[c.scorer]}
                  value={c.expected}
                  onChange={(e) => update(i, { expected: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor={`case-${c.id}-scorer`} className="mb-1 block text-xs font-semibold text-mute md:sr-only">
                  Scored by, case {i + 1}
                </label>
                <select
                  id={`case-${c.id}-scorer`}
                  className="field"
                  value={c.scorer}
                  onChange={(e) => update(i, { scorer: e.target.value as ScorerKind })}
                >
                  {SCORERS.map((s) => (
                    <option key={s} value={s}>
                      {SCORER_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove case ${i + 1}`}
                className="justify-self-start rounded-lg border border-line px-3 py-2 text-sm text-mute transition-colors hover:border-fail hover:text-fail md:justify-self-end"
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line/70 pt-4">
        <button type="button" onClick={add} disabled={full} className="btn btn-quiet">
          Add test case
        </button>
        {full ? <span className="text-sm text-mute">A run can have up to {LIMITS.maxCases} cases.</span> : null}
      </div>
    </fieldset>
  );
}
