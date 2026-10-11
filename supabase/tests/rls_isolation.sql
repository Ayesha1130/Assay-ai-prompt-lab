-- RLS isolation check. Paste into the Supabase SQL Editor and run it.
-- It creates two throwaway users, tries to cross the line between them, raises an error if
-- anything is allowed that should not be, and then rolls everything back. Nothing is kept.
--
-- A final line saying "RLS isolation: all checks passed" means every check held.

begin;

-- Two fake accounts. Fixed ids so the checks below can refer to them.
insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'rls-alice@example.invalid'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'rls-bob@example.invalid');

-- Alice's data, created as Alice.
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;

insert into public.runs (id, name, request, results)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice run', '{}'::jsonb, '[]'::jsonb);
insert into public.api_usage (calls) values (2);

do $$
begin
  if (select count(*) from public.runs) <> 1 then raise exception 'FAIL: Alice cannot see her own run'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: Alice should see exactly her own profile'; end if;
  if (select count(*) from public.api_usage) <> 1 then raise exception 'FAIL: Alice cannot see her own usage'; end if;
end $$;

-- Bob must see nothing of Alice's, and must not be able to touch it.
reset role;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  changed int;
begin
  if (select count(*) from public.runs) <> 0 then raise exception 'FAIL: Bob can read Alice runs'; end if;
  if (select count(*) from public.api_usage) <> 0 then raise exception 'FAIL: Bob can read Alice usage'; end if;
  if exists (select 1 from public.profiles where id <> '22222222-2222-2222-2222-222222222222') then
    raise exception 'FAIL: Bob can read another profile';
  end if;

  update public.runs set name = 'hacked' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: Bob renamed Alice run'; end if;

  delete from public.runs where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: Bob deleted Alice run'; end if;

  -- Bob cannot write rows that claim to belong to Alice.
  begin
    insert into public.runs (name, user_id, request, results)
    values ('forged', '11111111-1111-1111-1111-111111111111', '{}'::jsonb, '[]'::jsonb);
    raise exception 'FAIL: Bob inserted a run owned by Alice';
  exception when insufficient_privilege or check_violation then
    null; -- expected
  end;

  begin
    insert into public.api_usage (user_id, calls) values ('11111111-1111-1111-1111-111111111111', 1);
    raise exception 'FAIL: Bob recorded usage for Alice';
  exception when insufficient_privilege or check_violation then
    null; -- expected
  end;

  -- Nobody can reset an allowance or rewrite results.
  begin
    delete from public.api_usage;
    raise exception 'FAIL: usage rows can be deleted';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    update public.runs set results = '[1]'::jsonb;
    raise exception 'FAIL: results can be rewritten';
  exception when insufficient_privilege then
    null; -- expected
  end;
end $$;

-- Signed-out visitors (anon) get nothing at all.
reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.runs;
    raise exception 'FAIL: anon can read runs';
  exception when insufficient_privilege then
    null; -- expected
  end;
  begin
    perform 1 from public.profiles;
    raise exception 'FAIL: anon can read profiles';
  exception when insufficient_privilege then
    null; -- expected
  end;
end $$;

reset role;
select 'RLS isolation: all checks passed' as result;

rollback;
