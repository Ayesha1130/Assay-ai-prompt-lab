# Setup guide

## 1. Install and run

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3000
npm test                       # unit tests, Node 22.6+
npm run typecheck
npm run lint
npm run build
```

Without Supabase variables the landing page and `/demo` still work. Sign-in, saving and the dashboard need Supabase.

## 2. Database: which migrations to run

Open **Supabase Dashboard > SQL Editor** and run these files, in order, once each:

| Order | File | Run it if |
| --- | --- | --- |
| 1 | `supabase/migrations/0001_runs.sql` | You have never set this project up. Skip it if the `runs` table already exists. |
| 2 | `supabase/migrations/0002_ownership_profiles_usage.sql` | Always. Adds experiment names, `profiles`, `api_usage`, tighter privileges and policies. |
| 3 | `supabase/tests/rls_isolation.sql` | Optional. Creates two throwaway users inside a transaction, checks they cannot see each other's rows, then rolls everything back. Read the output for any failure. |

### Existing rows from the first version

The first version let anonymous visitors save runs. Those rows belong to anonymous users, so they are **not** visible to new accounts and are not deleted. To keep one for yourself, find your new user id under **Authentication > Users** and run:

```sql
update public.runs set user_id = 'YOUR-USER-UUID' where id = 'THE-RUN-UUID';
```

Runs saved in a browser's local storage can be imported from the History page with one button.

## 3. Supabase dashboard settings

**Authentication > URL Configuration**
- Site URL: your production address (for local work, `http://localhost:3000`).
- Redirect URLs, add each: `http://localhost:3000/auth/callback`, `https://YOUR-DOMAIN/auth/callback`, and the same two with `/auth/confirm`.

**Authentication > Sign In / Providers**
- Email: enabled. Keep **Confirm email** on so addresses are verified.
- **Anonymous sign-ins: keep OFF.** The migration also blocks anonymous users from saving, as a second guard.

**Authentication > Emails**: if the default confirmation and reset templates link to `{{ .ConfirmationURL }}`, they work with `/auth/callback`. If you customise them to use token hashes, point them at `/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (or `type=recovery`).

Supabase's built-in email sender is rate limited. For real use, add your own SMTP under **Authentication > SMTP**.

## 4. Google sign-in (optional)

1. Google Cloud Console > **APIs & Services > OAuth consent screen**: configure the app.
2. **Credentials > Create credentials > OAuth client ID > Web application**.
3. Authorised redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.
4. Copy the client ID and secret into **Supabase > Authentication > Providers > Google** and enable it.
5. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and restart. The Google button only appears when this is true.

## 5. Environment variables

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser. **There is no service-role key in this app and none should be added.** `OPENAI_API_KEY` is server only.

## 6. How paid usage is limited

- Visitors can only use the simulated `demo-sim` model.
- Real models need a signed-in user, at most 12 test cases per run, and stay within `PAID_RUNS_PER_HOUR` / `PAID_RUNS_PER_DAY` per user. Usage is counted in `api_usage`, which users cannot edit or delete. If that check fails, the run is refused.
- A short in-memory burst limiter also applies. It is per server instance. Behind several instances, replace `src/lib/rate-limit.ts` with a shared store such as Upstash Redis.
- The limiters read the first `x-forwarded-for` address, so deploy behind a proxy that sets it itself (Vercel does).

## 7. Manual testing checklist

Auth
- [ ] Sign up with email and password, with a name. A confirmation email arrives; the link signs you in.
- [ ] Wrong password shows a friendly message. Weak or mismatched passwords are caught before sending.
- [ ] Forgot password: an email arrives; the link opens `/reset-password`; a new password works; the same message appears for unknown emails.
- [ ] Sign out, then open `/dashboard`, `/lab`, `/runs`, `/account`: each redirects to `/login?next=...` and returns you after login.
- [ ] While signed in, `/login` and `/signup` redirect to `/dashboard`.
- [ ] `/login?next=https://evil.example` and `?next=//evil.example` land on `/dashboard`.
- [ ] Google button hidden when the flag is false; works when configured.
- [ ] Refresh and close/reopen the browser: still signed in.

Language
- [ ] Switch EN / RU in the navbar: the text changes immediately; reload keeps the choice; no console hydration warnings.
- [ ] Account > Preferred language saves and applies.

Product
- [ ] Landing page: preview runs, buttons go to the right places, mobile menu opens with Escape to close.
- [ ] `/demo` as a visitor: only the demo model is selectable, nothing is saved, the sign-up prompt appears after a run.
- [ ] New account dashboard shows the empty state; after a run it shows real counts and the experiment.
- [ ] Lab: a run saves, appears in History, can be renamed, re-run with "Edit and run again", and deleted.
- [ ] With an API key: a 13-case run on a gpt model is refused; exceeding the hourly allowance shows a clear message.
- [ ] Two accounts: neither can open the other's `/runs/<id>` (shows "Run not found").
- [ ] Account page: change name, change password, sign out.

## 8. Known limitations

- The Prompt Lab internals (editors, results text) are English only. Landing, auth, dashboard, account, demo framing and navigation are translated.
- Experiment results are computed in the browser from the server's stream and then submitted for saving, so a user could save altered results to their **own** history. Other users cannot see or change them.
- The burst limiter is in memory (see above).
- Roman Urdu text was written without a native-speaker review.
