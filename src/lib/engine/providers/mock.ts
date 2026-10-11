import type { CompleteArgs, Completion, ScorerKind } from "../types.ts";
import { sleep } from "../util.ts";

/** Deterministic hash to [0, 1). Same input always gives the same number. */
export function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return ((h >>> 0) % 100000) / 100000;
}

const STRICT = /\b(only|exactly|just)\b/i;

export function isStrict(template: string): boolean {
  return STRICT.test(template);
}

/**
 * How likely the simulated model is to answer correctly, based on traits that
 * make real prompts better: clear constraints, a role, listed options, enough detail.
 */
export function promptQuality(template: string): number {
  const t = template.toLowerCase();
  let q = 0.42;
  if (STRICT.test(t)) q += 0.22;
  if (/you are|act as/.test(t)) q += 0.08;
  if (/one of|options|labels|categories|choose|either/.test(t)) q += 0.12;
  if (/json|format|schema/.test(t)) q += 0.04;
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words > 12) q += 0.06;
  if (words > 30) q += 0.03;
  return Math.min(0.96, q);
}

const DISTRACTORS = ["other", "unclear", "n/a", "none"];

function distractor(expected: string): string {
  const n = expected.trim().toLowerCase();
  return DISTRACTORS.find((d) => d !== n) ?? "unknown";
}

function regexSample(pattern: string): string {
  return (
    pattern
      .replace(/[\^$\\]/g, "")
      .split("|")[0]
      .replace(/[()?*+]/g, "")
      .trim() || "match"
  );
}

function words(n: number): string {
  return Array.from({ length: Math.max(1, n) }, () => "word").join(" ");
}

function buildAnswer(scorer: ScorerKind, expected: string, correct: boolean): string {
  switch (scorer) {
    case "exact":
    case "contains":
      return correct ? expected.trim() : distractor(expected);
    case "regex":
      return correct ? regexSample(expected) : "no match here";
    case "json": {
      if (!correct) return "{ not json";
      const keys = expected
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      return JSON.stringify(Object.fromEntries(keys.map((k) => [k, "sample"])));
    }
    case "maxWords": {
      const limit = Number(expected) || 10;
      return correct ? words(Math.max(1, limit - 1)) : words(limit * 3);
    }
  }
}

export async function mockComplete(args: CompleteArgs): Promise<Completion> {
  const { template, input, expected, scorer, signal } = args;
  const seed = `${template}|${input}`;
  const correct = hash01(seed) < promptQuality(template);
  const chatty = !isStrict(template) && hash01(`wrap|${seed}`) < 0.6;

  const delay = 70 + hash01(`lat|${seed}`) * 200 + Math.min(120, template.length * 0.2);
  await sleep(delay, signal);

  let text = buildAnswer(scorer, expected, correct);
  if (chatty && scorer !== "maxWords") {
    if (scorer === "json") text = `Here you go: ${text}`;
    else if (correct) text = `Sure! Looking at this, I'd say it's ${text}. Let me know if you need anything else.`;
    else text = `I think it's ${text}, but I'm not fully certain.`;
  }
  return { text };
}
