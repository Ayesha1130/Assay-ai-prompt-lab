import { ProviderError } from "../errors.ts";
import type { CompleteFn } from "../types.ts";
import { mockComplete } from "./mock.ts";
import { openaiComplete } from "./openai.ts";

export const defaultComplete: CompleteFn = (args) => {
  switch (args.model.provider) {
    case "mock":
      return mockComplete(args);
    case "openai":
      return openaiComplete(args);
    default:
      throw new ProviderError(`No provider for model ${args.model.id}`);
  }
};
