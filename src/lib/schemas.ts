import { z } from "zod";

import { LIMITS } from "./engine/runner.ts";
import { RunRequestSchema } from "./engine/schema.ts";
import { isLang } from "./i18n/translate.ts";

const CaseResultSchema = z.object({
  side: z.enum(["A", "B"]),
  caseId: z.string().min(1).max(64),
  output: z.string().max(LIMITS.maxOutput),
  pass: z.boolean(),
  score: z.number().min(0).max(1),
  note: z.string().max(300).optional(),
  latencyMs: z.number().min(0).max(10 * 60 * 1000),
  inputTokens: z.number().int().min(0).max(1_000_000),
  outputTokens: z.number().int().min(0).max(1_000_000),
  costUsd: z.number().min(0).max(1000),
  error: z.string().max(500).optional(),
});

export const EXPERIMENT_NAME_MAX = 80;

const NameSchema = z.string().trim().min(1, "Give the experiment a name.").max(EXPERIMENT_NAME_MAX);

/** What the browser may send when saving an experiment. The owner and the date are set on the server. */
export const SaveExperimentSchema = z
  .object({
    name: NameSchema.optional(),
    request: RunRequestSchema,
    results: z.array(CaseResultSchema).max(LIMITS.maxCases * 2),
  })
  .superRefine((value, ctx) => {
    const known = new Set(value.request.cases.map((c) => c.id));
    const seen = new Set<string>();
    for (const [index, result] of value.results.entries()) {
      const key = `${result.side}:${result.caseId}`;
      if (!known.has(result.caseId)) {
        ctx.addIssue({ code: "custom", path: ["results", index], message: "A result refers to a test case that is not in the experiment." });
      } else if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["results", index], message: "The experiment has two results for the same case and prompt." });
      }
      seen.add(key);
    }
  });

export const RenameExperimentSchema = z.object({ name: NameSchema });

export const ProfileUpdateSchema = z
  .object({
    display_name: z.string().trim().min(1, "Enter a name.").max(60, "Names can be up to 60 characters.").optional(),
    preferred_language: z.string().refine(isLang, "Choose a supported language.").optional(),
  })
  .refine((v) => v.display_name !== undefined || v.preferred_language !== undefined, "Nothing to update.");

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
