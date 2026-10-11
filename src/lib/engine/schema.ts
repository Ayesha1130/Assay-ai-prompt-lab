import { z } from "zod";
import { getModel } from "./pricing.ts";
import { LIMITS } from "./runner.ts";

const VariantSchema = z.object({
  name: z.string().trim().min(1, "Give each prompt a name.").max(60),
  template: z
    .string()
    .trim()
    .min(1, "Each prompt needs some text.")
    .max(LIMITS.maxTemplate, `Prompts can be up to ${LIMITS.maxTemplate} characters.`),
  model: z.string().refine((id) => getModel(id) !== undefined, "Choose a model from the list."),
});

const CaseSchema = z.object({
  id: z.string().min(1).max(64),
  input: z
    .string()
    .trim()
    .min(1, "Every test case needs an input.")
    .max(LIMITS.maxInput, `Inputs can be up to ${LIMITS.maxInput} characters.`),
  expected: z.string().max(LIMITS.maxExpected, `Expected answers can be up to ${LIMITS.maxExpected} characters.`),
  scorer: z.enum(["exact", "contains", "regex", "json", "maxWords"]),
});

export const RunRequestSchema = z
  .object({
    a: VariantSchema,
    b: VariantSchema,
    cases: z
      .array(CaseSchema)
      .min(1, "Add at least one test case.")
      .max(LIMITS.maxCases, `Runs can have up to ${LIMITS.maxCases} test cases.`),
  })
  .refine((r) => new Set(r.cases.map((c) => c.id)).size === r.cases.length, "Test case ids must be unique.");
