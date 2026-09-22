begin;

-- A previous onboarding attempt provisioned tenants inside an auth.users trigger.
-- Auth must remain independent so a tenant-data error can never reject user creation.
drop trigger if exists on_auth_user_created_create_tenant on auth.users;

-- Preserve any operator granted through the temporary platform_admins table before
-- removing that duplicate authorization model.
do $$
begin
  if to_regclass('public.platform_admins') is not null then
    execute 'insert into public.platform_operators (user_id)
      select user_id from public.platform_admins on conflict do nothing';
  end if;
end;
$$;
drop table if exists public.platform_admins;

drop function if exists public.provision_tenant(uuid, text, text, text, text);
drop function if exists public.provision_tenant(uuid, text, text);

create function public.provision_tenant(
  p_user_id uuid,
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := trim(p_name);
  v_slug text := lower(trim(p_slug));
  v_org uuid;
  v_location uuid;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.organization_members where user_id = p_user_id) then
    raise exception 'user_already_has_tenant' using errcode = 'P0001';
  end if;
  if length(v_name) not between 2 and 160
    or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(v_slug) not between 3 and 40
    or v_slug in ('admin', 'api', 'www', 'platform', 'system', 'tenant', 'login', 'register', 'baseline')
  then
    raise exception 'invalid_tenant_details' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug)
  values (v_name, v_slug)
  returning id into v_org;
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org, p_user_id, 'owner');
  insert into public.profiles (id) values (p_user_id) on conflict do nothing;
  insert into public.locations (organization_id, name, timezone)
  values (v_org, v_name, 'Asia/Manila') returning id into v_location;
  insert into public.courts (organization_id, location_id, name, surface, hourly_rate_minor)
  values (v_org, v_location, 'Court 1', 'Hard', 50000);

  return v_org;
exception when unique_violation then
  raise exception 'slug_taken' using errcode = '23505';
end;
$$;

revoke all on function public.provision_tenant(uuid, text, text) from public, anon, authenticated;
grant execute on function public.provision_tenant(uuid, text, text) to service_role;

-- The authenticated fallback is retained for accounts created before this migration,
-- but it must not allow one user to create an unlimited number of organizations.
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
  if exists (select 1 from public.organization_members where user_id = v_user) then
    raise exception 'user_already_has_tenant' using errcode = 'P0001';
  end if;
  if length(trim(p_name)) not between 2 and 160
    or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(p_slug) not between 3 and 40
    or p_slug in ('admin', 'api', 'www', 'platform', 'system', 'tenant', 'login', 'register', 'baseline')
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
