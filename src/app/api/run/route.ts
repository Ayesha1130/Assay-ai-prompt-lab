import type { NextRequest } from "next/server";

import { firstIssue, problem, readJson } from "@/lib/api-helpers";
import { getModel } from "@/lib/engine/pricing";
import { defaultComplete } from "@/lib/engine/providers";
import { runComparison } from "@/lib/engine/runner";
import { RunRequestSchema } from "@/lib/engine/schema";
import type { RunEvent } from "@/lib/engine/types";
import { reservePaidRun } from "@/lib/paid-usage";
import { allow } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/site";
import { getUser } from "@/lib/supabase/server";
import { PAID_MAX_CASES } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/**
 * Runs a comparison and streams one JSON line per finished answer.
 *
 * - Demo model (free, simulated): open to everyone, with a generous per-visitor limit.
 * - Real models (paid): needs a signed-in account, a small per-account allowance recorded in the
 *   database, a smaller test-case cap, and a short per-account burst limit. The user comes from the
 *   session cookie checked on the server, never from the request body.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return problem("Cross-site request blocked.", 403);

  const parsedBody = await readJson(req);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = RunRequestSchema.safeParse(parsedBody.body);
  if (!parsed.success) return problem(firstIssue(parsed.error), 400);
  const request = parsed.data;

  const usesPaidModel = [request.a.model, request.b.model].some((id) => getModel(id)?.provider !== "mock");

  if (usesPaidModel) {
    const { supabase, user } = await getUser();
    if (!supabase || !user) {
      return problem("Sign in to run real models. The demo model is free without an account.", 401);
    }
    if (!process.env.OPENAI_API_KEY) {
      return problem("This server has no OPENAI_API_KEY. Choose the demo model, or add a key to .env.local.", 400);
    }
    if (request.cases.length > PAID_MAX_CASES) {
      return problem(`Runs with real models can have up to ${PAID_MAX_CASES} test cases. Remove some, or use the demo model.`, 400);
    }
    if (!allow(`paid-burst:${user.id}`, 3, 60_000)) {
      return problem("Slow down a little. Wait a minute before starting another real run.", 429);
    }
    const reservation = await reservePaidRun(supabase, user.id, request.cases.length * 2);
    if (!reservation.ok) return problem(reservation.message, reservation.status);
  } else if (!allow(`demo:${clientKey(req)}`, 40, 10 * 60_000)) {
    return problem("That is a lot of demo runs. Wait a few minutes and try again.", 429);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: RunEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };

      try {
        await runComparison(request, { complete: defaultComplete, signal: req.signal, onEvent: send });
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "The run failed." });
      } finally {
        if (open) {
          open = false;
          controller.close();
        }
      }
    },
    cancel() {
      // The browser went away. req.signal aborts the runner, nothing else to clean up.
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
