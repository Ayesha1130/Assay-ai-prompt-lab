import { firstIssue, ok, problem, readJson, requireUser } from "@/lib/api-helpers";
import { ProfileUpdateSchema } from "@/lib/schemas";
import { isSameOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Updates the signed-in user's own profile. The id always comes from the session, never the body. */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return problem("Cross-site request blocked.", 403);

  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = ProfileUpdateSchema.safeParse(body.body);
  if (!parsed.success) return problem(firstIssue(parsed.error), 400);

  const { data, error } = await auth.supabase
    .from("profiles")
    .upsert({ id: auth.user.id, ...parsed.data }, { onConflict: "id" })
    .select("display_name, preferred_language")
    .single();
  if (error || !data) return problem("We could not save your profile.", 500);

  return ok({ profile: data });
}
