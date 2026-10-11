-- 0002: accounts, ownership, profiles and paid-usage tracking.
-- Run this in the Supabase SQL Editor AFTER 0001_runs.sql. It is safe to run more than once,
-- and it never deletes or rewrites existing experiments.

------------------------------------------------------------------------------------------------
-- 1. runs (the experiments table)
------------------------------------------------------------------------------------------------
-- Existing rows keep their owner. Rows saved before accounts existed belong to the anonymous
-- users the first version created. They stay in the table, still protected by row level
-- security, and are not visible to any new account. See docs/SETUP.md if you want to move
-- your own legacy rows to your real account.

alter table public.runs add column if not exists name text;

alter table public.runs drop constraint if exists runs_name_length;
alter table public.runs
  add constraint runs_name_length check (name is null or char_length(name) between 1 and 80);

-- The server now creates experiments, so the database generates the id.
alter table public.runs alter column id set default gen_random_uuid();

-- Least privilege: signed-out visitors (anon) get nothing, signed-in users can read, create,
-- delete, and rename (name is the only column they may update; results stay as they were run).
revoke all on table public.runs from anon;
revoke all on table public.runs from authenticated;
grant select, insert, delete on table public.runs to authenticated;
grant update (name) on table public.runs to authenticated;

drop policy if exists "Rename own runs" on public.runs;
create policy "Rename own runs" on public.runs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Belt and braces: even if someone later switches on anonymous sign-ins, those throwaway
-- accounts cannot create new experiments.
drop policy if exists "No anonymous saves" on public.runs;
create policy "No anonymous saves" on public.runs
  as restrictive
  for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

------------------------------------------------------------------------------------------------
-- 2. profiles
------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text check (display_name is null or char_length(display_name) between 1 and 60),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ru')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name, preferred_language) on table public.profiles to authenticated;
grant update (display_name, preferred_language) on table public.profiles to authenticated;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Create own profile" on public.profiles;
create policy "Create own profile" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile for every new account, using the name from the signup form (or Google).
-- security definer lets the trigger write even though the new user has no session yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')), 60), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Give everyone who already has an account a profile.
insert into public.profiles (id, display_name)
select
  u.id,
  nullif(left(btrim(coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', '')), 60), '')
from auth.users u
on conflict (id) do nothing;

------------------------------------------------------------------------------------------------
-- 3. api_usage: one row per paid run, used to enforce per-account limits
------------------------------------------------------------------------------------------------
-- Users can read their own rows and add new ones through the server. There is deliberately no
-- update or delete policy, so a user cannot reset their own allowance.
create table if not exists public.api_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  calls      integer not null check (calls between 1 and 100)
);

create index if not exists api_usage_user_created_idx on public.api_usage (user_id, created_at desc);

alter table public.api_usage enable row level security;

revoke all on table public.api_usage from anon;
revoke all on table public.api_usage from authenticated;
grant select on table public.api_usage to authenticated;
grant insert (user_id, calls) on table public.api_usage to authenticated;

drop policy if exists "Read own usage" on public.api_usage;
create policy "Read own usage" on public.api_usage
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Record own usage" on public.api_usage;
create policy "Record own usage" on public.api_usage
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "No anonymous usage" on public.api_usage;
create policy "No anonymous usage" on public.api_usage
  as restrictive
  for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
