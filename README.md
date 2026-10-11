# Assay

Compare two versions of a prompt over the same test cases. Assay runs both, scores every answer with a plain rule, and shows which prompt is more accurate, faster and cheaper. Results appear as a 3D chart as they stream in.

Built with Next.js 15, TypeScript, Tailwind CSS 4, React Three Fiber, Zod and Supabase.

## What is in it

- A public landing page with an interactive preview that runs the real comparison engine in the browser against a simulated model, and a free `/demo` lab.
- English and Roman Urdu (Latin script), from one typed dictionary in `src/lib/i18n`.
- Supabase sign-up, sign-in, Google (optional), email verification, password reset, persistent sessions, protected routes.
- A dashboard that shows only real stored data, a history with rename and delete, and an account page.
- Per-user storage with Row Level Security, and per-user limits on paid model calls.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm test           # unit tests, Node 22.6+
npm run typecheck && npm run lint && npm run build
```

Full instructions, the SQL to run, Supabase and Google setup, and a manual test checklist are in **[docs/SETUP.md](docs/SETUP.md)**.

## How it works

```
Lab (browser)  --POST /api/run-->  runComparison()  --calls-->  provider (mock | OpenAI)
      ^                                  |
      +------ newline-delimited JSON ----+   one line per finished answer
```

- **`src/lib/engine`** is plain TypeScript with no framework imports, so it is easy to test. `runner.ts` runs every case on both prompts with a concurrency limit, a per-call timeout, retries for rate limits and server errors, and cancellation.
- **Scoring is deterministic.** Exact match, contains, regex, valid JSON with required keys, and max words. The same run always gives the same score, and there is no model grading another model.
- **Streaming** uses newline-delimited JSON over a normal `fetch` stream. The browser reads each answer as it finishes, which drives the progress bar and the 3D columns.
- **The comparison** reports pass rate, average and slowest-5% latency, cost, and which cases one prompt fixed or broke compared with the other.

## Decisions worth knowing about

- **Paid runs need an account.** Visitors only get the simulated model. Signed-in users get a per-user hourly and daily allowance recorded in the database, plus a 12-case cap and an in-memory burst limiter (`src/lib/rate-limit.ts`, per instance). See `docs/SETUP.md`.
- **Request limits** are enforced with Zod on the server: at most 25 cases, 4000 characters per prompt, 2000 per input.
- **Row Level Security** on `runs`, `profiles` and `api_usage` limits every row to its owner. The user id is always taken from the server session, never from the request. Runs can only be renamed, not edited.
- **Small samples are called out.** Under 20 cases the verdict says it is a hint, not proof.
- **Accessibility.** Pass and fail are shown with words and symbols as well as colour. The 3D chart has a text summary for screen readers and a fallback when WebGL is missing. Animation stops with `prefers-reduced-motion`.

## Design

Colours live in six variables at the top of `src/app/globals.css`. Marigold always means prompt A, orchid always means prompt B, and mint and coral only ever mean pass and fail. Change those values to re-theme the app.

## Project layout

```
src/app/                 pages (marketing, auth, app) and API routes
src/lib/auth, i18n/      redirects, route rules, validation, dictionaries
docs/SETUP.md            setup, SQL order, Supabase and Google config, checklist
src/components/          lab, results, history
src/components/three/    hero scene and the results chart
src/lib/engine/          runner, scorers, providers, pricing, schema
supabase/migrations/     database schema and policies
tests/                   unit tests (node:test)
```
