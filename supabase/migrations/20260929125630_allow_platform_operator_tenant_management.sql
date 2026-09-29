begin;

-- Platform operators can work inside any venue dashboard. Keep this logic in
-- the existing private helpers so every tenant RLS policy applies consistently.
create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      private.is_platform_admin()
      or exists (
        select 1
        from public.organization_members member
        where member.organization_id = target_organization_id
          and member.user_id = (select auth.uid())
      )
    )
$$;

create or replace function private.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      private.is_platform_admin()
      or exists (
        select 1
        from public.organization_members member
        where member.organization_id = target_organization_id
          and member.user_id = (select auth.uid())
          and member.role in ('owner', 'admin')
      )
    )
$$;

revoke all on function private.is_organization_member(uuid) from public, anon;
revoke all on function private.is_organization_admin(uuid) from public, anon;
grant execute on function private.is_organization_member(uuid) to authenticated, service_role;
grant execute on function private.is_organization_admin(uuid) to authenticated, service_role;

-- These policies are now redundant because the shared membership/admin helpers
-- include platform operators. Removing them also avoids duplicate policy work.
drop policy if exists "platform admins read bookings" on public.bookings;
drop policy if exists "platform admins read courts" on public.courts;
drop policy if exists "platform admins read locations" on public.locations;
drop policy if exists "platform admins read memberships" on public.organization_members;
drop policy if exists "platform admins read organizations" on public.organizations;
drop policy if exists "platform admins update organizations" on public.organizations;
drop policy if exists "platform admins read payments" on public.payments;
drop policy if exists "platform admins read payment methods" on public.venue_payment_methods;

commit;
