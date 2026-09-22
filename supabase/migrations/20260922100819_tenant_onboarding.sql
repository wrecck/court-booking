begin;

alter table public.courts add column hourly_rate_minor integer not null default 50000
  check (hourly_rate_minor between 0 and 10000000);

create table public.platform_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_operators enable row level security;
create policy "operators can identify themselves" on public.platform_operators
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.platform_operators to authenticated;

-- Bootstrap the operator from the owner of the original demo venue. Future operators
-- must be added deliberately by a database administrator.
insert into public.platform_operators (user_id)
select user_id from public.organization_members
where organization_id = '11111111-1111-4111-8111-111111111111' and role = 'owner'
on conflict do nothing;

create or replace function public.register_tenant(p_name text, p_slug text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_location uuid;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if length(trim(p_name)) not between 2 and 160
    or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(p_slug) not between 3 and 40
    or p_slug in ('admin', 'api', 'www', 'platform', 'tenant', 'login', 'register', 'baseline')
  then raise exception 'invalid_tenant_details' using errcode = '22023'; end if;

  insert into public.organizations (name, slug) values (trim(p_name), p_slug)
  returning id into v_org;
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org, v_user, 'owner');
  insert into public.profiles (id) values (v_user) on conflict do nothing;
  insert into public.locations (organization_id, name, timezone)
  values (v_org, trim(p_name), 'Asia/Manila') returning id into v_location;
  insert into public.courts (organization_id, location_id, name, surface, hourly_rate_minor)
  values (v_org, v_location, 'Court 1', 'Hard', 50000);
  return v_org;
exception when unique_violation then
  raise exception 'slug_taken' using errcode = '23505';
end;
$$;
revoke all on function public.register_tenant(text, text) from public, anon;
grant execute on function public.register_tenant(text, text) to authenticated;

commit;
