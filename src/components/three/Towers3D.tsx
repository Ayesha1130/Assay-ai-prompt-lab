"use client";

import dynamic from "next/dynamic";

import type { CaseResult } from "@/lib/engine/types";

import { SceneBoundary } from "./SceneBoundary";
import { useReducedMotion } from "./useReducedMotion";

const TowersScene = dynamic(() => import("./TowersScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-panel" />,
});

/** A 3D bar chart: two columns per test case, one per prompt. Drag to turn it. */
export function Towers3D({ caseIds, results }: { caseIds: string[]; results: CaseResult[] }) {
  const reduced = useReducedMotion();
  const passA = results.filter((r) => r.side === "A" && r.pass).length;
  const passB = results.filter((r) => r.side === "B" && r.pass).length;

  return (
    <div className="h-full w-full">
      <SceneBoundary fallback={<div className="grid h-full place-items-center bg-panel text-sm text-mute">3D view needs WebGL. The table below has every result.</div>}>
        <TowersScene caseIds={caseIds} results={results} animate={!reduced} />
      </SceneBoundary>
      <p className="sr-only">
        Chart of {caseIds.length} test cases. Prompt A passed {passA}, prompt B passed {passB}.
      </p>
    </div>
  );
}
