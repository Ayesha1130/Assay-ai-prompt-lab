import { ProviderError } from "../errors.ts";
import type { CompleteArgs, Completion } from "../types.ts";

interface ChatResponse {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

export async function openaiComplete(args: CompleteArgs): Promise<Completion> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new ProviderError("OPENAI_API_KEY is not set on the server. Pick the demo model or add a key.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: args.model.id,
      temperature: 0,
      max_tokens: 400,
      messages: [{ role: "user", content: args.prompt }],
    }),
    signal: args.signal,
  });

  if (!res.ok) {
    let message = `OpenAI returned ${res.status}`;
    try {
      const body = (await res.json()) as ChatResponse;
      if (body.error?.message) message += `: ${body.error.message}`;
    } catch {
      // body was not JSON, keep the status message
    }
    throw new ProviderError(message, res.status === 429 || res.status >= 500);
  }

  const body = (await res.json()) as ChatResponse;
  return {
    text: body.choices?.[0]?.message?.content ?? "",
    inputTokens: body.usage?.prompt_tokens,
    outputTokens: body.usage?.completion_tokens,
  };
}
