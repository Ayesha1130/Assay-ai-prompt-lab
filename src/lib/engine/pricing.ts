export type Provider = "mock" | "openai";

export interface ModelInfo {
  id: string;
  label: string;
  provider: Provider;
  /** USD per one million tokens. Approximate, edit to match current price lists. */
  inputPer1M: number;
  outputPer1M: number;
  note: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "demo-sim",
    label: "Demo model (simulated)",
    provider: "mock",
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    note: "Free. Simulated answers, priced like a small model.",
  },
  {
    id: "gpt-4o-mini",
    label: "gpt-4o-mini",
    provider: "openai",
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    note: "Needs OPENAI_API_KEY on the server.",
  },
  {
    id: "gpt-4.1-mini",
    label: "gpt-4.1-mini",
    provider: "openai",
    inputPer1M: 0.4,
    outputPer1M: 1.6,
    note: "Needs OPENAI_API_KEY on the server.",
  },
  {
    id: "gpt-4o",
    label: "gpt-4o",
    provider: "openai",
    inputPer1M: 2.5,
    outputPer1M: 10,
    note: "Needs OPENAI_API_KEY on the server.",
  },
];

export function getModel(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Rough estimate used when a provider does not report token usage. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function costUsd(model: ModelInfo, inputTokens: number, outputTokens: number): number {
  return (inputTokens * model.inputPer1M + outputTokens * model.outputPer1M) / 1_000_000;
}
