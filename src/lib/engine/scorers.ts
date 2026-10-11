import type { ScorerKind } from "./types.ts";

export interface ScoreOutcome {
  pass: boolean;
  score: number;
  note?: string;
}

export const SCORER_LABELS: Record<ScorerKind, string> = {
  exact: "Exact match",
  contains: "Contains",
  regex: "Regex",
  json: "Valid JSON",
  maxWords: "Max words",
};

export const SCORER_HINTS: Record<ScorerKind, string> = {
  exact: "The full answer",
  contains: "Text that must appear",
  regex: "Pattern, e.g. ^(yes|no)$",
  json: "Required keys, comma separated",
  maxWords: "Word limit, e.g. 20",
};

/** Trim, drop wrapping quotes and trailing punctuation, collapse spaces, ignore case. */
export function normalize(text: string): string {
  let t = text.trim();
  // Repeat so that `"Billing".` loses the period first and then the quotes.
  for (let prev = ""; t !== prev; ) {
    prev = t;
    t = t
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[.!]+$/, "")
      .trim();
  }
  return t.replace(/\s+/g, " ").toLowerCase();
}

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function stripFences(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : text.trim();
}

export function score(kind: ScorerKind, output: string, expected: string): ScoreOutcome {
  switch (kind) {
    case "exact": {
      if (!expected.trim()) return { pass: false, score: 0, note: "No expected answer set" };
      const pass = normalize(output) === normalize(expected);
      return { pass, score: pass ? 1 : 0 };
    }
    case "contains": {
      if (!expected.trim()) return { pass: false, score: 0, note: "No expected text set" };
      const pass = normalize(output).includes(normalize(expected));
      return { pass, score: pass ? 1 : 0 };
    }
    case "regex": {
      try {
        const pass = new RegExp(expected, "i").test(output.trim());
        return { pass, score: pass ? 1 : 0 };
      } catch {
        return { pass: false, score: 0, note: "Invalid regex" };
      }
    }
    case "json": {
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(output));
      } catch {
        return { pass: false, score: 0, note: "Output is not valid JSON" };
      }
      const keys = expected
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      if (keys.length === 0) return { pass: true, score: 1 };
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { pass: false, score: 0, note: "JSON is not an object" };
      }
      const present = keys.filter((k) => Object.prototype.hasOwnProperty.call(parsed, k));
      const missing = keys.filter((k) => !present.includes(k));
      return {
        pass: missing.length === 0,
        score: present.length / keys.length,
        note: missing.length ? `Missing keys: ${missing.join(", ")}` : undefined,
      };
    }
    case "maxWords": {
      const limit = Number(expected);
      if (!Number.isFinite(limit) || limit <= 0) {
        return { pass: false, score: 0, note: "Word limit must be a positive number" };
      }
      const words = countWords(output);
      const pass = words > 0 && words <= limit;
      return { pass, score: pass ? 1 : 0, note: pass ? undefined : `${words} words, limit ${limit}` };
    }
  }
}
