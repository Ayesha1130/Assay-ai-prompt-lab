import { firstIssue, ok, problem, readJson, requireUser, RUN_COLUMNS, toSavedRun, type RunRow } from "@/lib/api-helpers";
import { allow } from "@/lib/rate-limit";
import { SaveExperimentSchema } from "@/lib/schemas";
import { isSameOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

const MAX_SAVED = 500;

/** The signed-in user's experiments, newest first. Row level security limits this to their own rows. */
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("runs")
    .select(RUN_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return problem("We could not load your experiments.", 500);

  return ok({ runs: (data as unknown as RunRow[]).map(toSavedRun) });
}

/**
 * Saves an experiment. The owner is the user the server found from the session, and the date is
 * the server clock. Anything the browser sends for those fields is ignored.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return problem("Cross-site request blocked.", 403);

  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  if (!allow(`save:${user.id}`, 30, 60_000)) return problem("You are saving too quickly. Wait a moment.", 429);

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = SaveExperimentSchema.safeParse(body.body);
  if (!parsed.success) return problem(firstIssue(parsed.error), 400);
  const { request: run, results, name } = parsed.data;

  const { count, error: countError } = await supabase.from("runs").select("id", { count: "exact", head: true });
  if (countError) return problem("We could not save your experiment.", 500);
  if ((count ?? 0) >= MAX_SAVED) {
    return problem(`You have reached the limit of ${MAX_SAVED} saved experiments. Delete some to save new ones.`, 409);
  }

  const { data, error } = await supabase
    .from("runs")
    .insert({ user_id: user.id, name: name ?? `${run.a.name} vs ${run.b.name}`.slice(0, 80), request: run, results })
    .select(RUN_COLUMNS)
    .single();
  if (error || !data) return problem("We could not save your experiment.", 500);

  return ok({ run: toSavedRun(data as unknown as RunRow) }, 201);
}
