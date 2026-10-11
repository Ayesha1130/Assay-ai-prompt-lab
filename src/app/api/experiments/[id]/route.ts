import { firstIssue, ok, problem, readJson, requireUser, RUN_COLUMNS, toSavedRun, type RunRow } from "@/lib/api-helpers";
import { RenameExperimentSchema, UUID_PATTERN } from "@/lib/schemas";
import { isSameOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function validId(context: Context): Promise<string | null> {
  const { id } = await context.params;
  return UUID_PATTERN.test(id) ? id : null;
}

export async function GET(_request: Request, context: Context) {
  const id = await validId(context);
  if (!id) return problem("Experiment not found.", 404);

  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  // Another person's experiment looks exactly like one that does not exist.
  const { data, error } = await auth.supabase.from("runs").select(RUN_COLUMNS).eq("id", id).maybeSingle();
  if (error) return problem("We could not load that experiment.", 500);
  if (!data) return problem("Experiment not found.", 404);

  return ok({ run: toSavedRun(data as unknown as RunRow) });
}

export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return problem("Cross-site request blocked.", 403);
  const id = await validId(context);
  if (!id) return problem("Experiment not found.", 404);

  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = RenameExperimentSchema.safeParse(body.body);
  if (!parsed.success) return problem(firstIssue(parsed.error), 400);

  const { data, error } = await auth.supabase
    .from("runs")
    .update({ name: parsed.data.name })
    .eq("id", id)
    .select(RUN_COLUMNS)
    .maybeSingle();
  if (error) return problem("We could not rename that experiment.", 500);
  if (!data) return problem("Experiment not found.", 404);

  return ok({ run: toSavedRun(data as unknown as RunRow) });
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return problem("Cross-site request blocked.", 403);
  const id = await validId(context);
  if (!id) return problem("Experiment not found.", 404);

  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase.from("runs").delete().eq("id", id).select("id");
  if (error) return problem("We could not delete that experiment.", 500);
  if (!data || data.length === 0) return problem("Experiment not found.", 404);

  return ok({ deleted: true });
}
