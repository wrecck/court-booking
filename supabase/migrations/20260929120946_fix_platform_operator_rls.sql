begin;

-- The temporary platform_admins table was replaced by platform_operators.
-- Keep the RLS helper in sync so operator and tenant membership lookups work.
create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.platform_operators operator
      where operator.user_id = (select auth.uid())
    )
$$;

revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated, service_role;

commit;
