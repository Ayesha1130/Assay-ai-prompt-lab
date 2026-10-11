-- Saved comparison runs, one row per run, owned by the signed-in (or anonymous) user.
-- Enable "Anonymous sign-ins" under Authentication > Providers so visitors get a private
-- history without creating an account.

create table if not exists public.runs (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  request    jsonb not null,
  results    jsonb not null,
  constraint runs_request_is_object check (jsonb_typeof(request) = 'object'),
  constraint runs_results_is_array check (jsonb_typeof(results) = 'array'),
  -- A run is capped at 25 cases x 2 sides, and output is trimmed to 4000 characters per result.
  constraint runs_results_size check (jsonb_array_length(results) <= 50)
);

create index if not exists runs_user_created_idx on public.runs (user_id, created_at desc);

alter table public.runs enable row level security;

-- (select auth.uid()) is evaluated once per statement instead of once per row.
create policy "Read own runs" on public.runs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Save own runs" on public.runs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Delete own runs" on public.runs
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Runs are never edited after they are saved, so there is deliberately no update policy.
