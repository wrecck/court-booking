begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.organization_role as enum ('owner', 'admin', 'staff');
create type public.booking_status as enum ('held', 'pending_payment_review', 'confirmed', 'cancelled', 'expired', 'completed', 'no_show');
create type public.payment_status as enum ('pending', 'proof_submitted', 'paid', 'rejected', 'failed', 'expired', 'refunded', 'paid_booking_conflict');
create type public.payment_mode as enum ('manual', 'automatic');
create type public.payment_method_type as enum ('ewallet', 'bank_transfer', 'cash', 'card');
create type public.connection_status as enum ('not_connected', 'pending', 'verified', 'restricted');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  currency char(3) not null default 'PHP',
  timezone text not null default 'Asia/Manila',
  initial_hold_minutes integer not null default 15 check (initial_hold_minutes between 5 and 60),
  manual_review_minutes integer not null default 45 check (manual_review_minutes between 10 and 1440),
  max_booking_hours smallint not null default 2 check (max_booking_hours between 1 and 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  timezone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index locations_organization_idx on public.locations(organization_id);

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  surface text,
  is_indoor boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (location_id, name)
);
create index courts_organization_idx on public.courts(organization_id);

create table public.venue_payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.payment_method_type not null,
  mode public.payment_mode not null,
  provider text not null,
  display_name text not null,
  account_name text,
  account_number text,
  bank_name text,
  qr_storage_path text,
  instructions text,
  provider_account_id text,
  connection_status public.connection_status not null default 'not_connected',
  is_enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mode = 'manual' or provider_account_id is not null),
  check (mode = 'manual' or connection_status in ('pending', 'verified', 'restricted'))
);
create index payment_methods_organization_idx on public.venue_payment_methods(organization_id, is_enabled, display_order);

create sequence public.booking_reference_seq start 1000;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  court_id uuid not null references public.courts(id),
  reference text not null unique default ('BK-' || to_char(current_date, 'YYMMDD') || '-' || nextval('public.booking_reference_seq')),
  status public.booking_status not null default 'held',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  slot tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  hold_expires_at timestamptz,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  player_count integer not null default 1 check (player_count between 1 and 20),
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null default 'PHP',
  guest_token_hash bytea,
  notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '2 hours'),
  check ((status in ('held', 'pending_payment_review') and hold_expires_at is not null) or status not in ('held', 'pending_payment_review')),
  constraint no_overlapping_active_bookings exclude using gist (
    court_id with =,
    slot with &&
  ) where (status in ('held', 'pending_payment_review', 'confirmed'))
);
create index bookings_organization_start_idx on public.bookings(organization_id, starts_at);
create index bookings_expiring_holds_idx on public.bookings(hold_expires_at) where status in ('held', 'pending_payment_review');
create index bookings_customer_idx on public.bookings(customer_user_id) where customer_user_id is not null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_method_id uuid references public.venue_payment_methods(id) on delete set null,
  mode public.payment_mode not null,
  provider text not null,
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount_expected_minor integer not null check (amount_expected_minor >= 0),
  amount_received_minor integer check (amount_received_minor >= 0),
  currency char(3) not null default 'PHP',
  transaction_reference text,
  paid_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_provider_reference_unique on public.payments(provider, provider_payment_id) where provider_payment_id is not null;
create unique index payments_manual_reference_per_org on public.payments(organization_id, provider, transaction_reference) where transaction_reference is not null and mode = 'manual';
create index payments_booking_idx on public.payments(booking_id, created_at desc);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  payer_name text not null,
  submitted_at timestamptz not null default now()
);
create index payment_proofs_review_idx on public.payment_proofs(organization_id, submitted_at);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  live_mode boolean not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.payment_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  type text not null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_organization_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (select 1 from public.organization_members m where m.organization_id = target_organization_id and m.user_id = (select auth.uid())) $$;

create or replace function private.is_organization_admin(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (select 1 from public.organization_members m where m.organization_id = target_organization_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')) $$;

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.is_organization_admin(uuid) from public;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.is_organization_admin(uuid) to authenticated;

create or replace function public.expire_booking_holds()
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update public.bookings set status = 'expired', updated_at = now()
  where status in ('held', 'pending_payment_review') and hold_expires_at <= now();
  get diagnostics affected = row_count;
  update public.payments p set status = 'expired', updated_at = now()
  from public.bookings b where p.booking_id = b.id and b.status = 'expired' and p.status in ('pending', 'proof_submitted');
  return affected;
end;
$$;

create or replace function public.create_booking_hold(
  p_organization_id uuid, p_court_id uuid, p_starts_at timestamptz, p_ends_at timestamptz,
  p_customer_name text, p_customer_email text, p_customer_phone text, p_player_count integer,
  p_amount_minor integer, p_currency text
) returns table (booking_id uuid, reference text, hold_expires_at timestamptz, guest_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  v_hold_minutes integer;
  v_max_booking_hours integer;
  v_location_id uuid;
  v_booking_id uuid;
  v_reference text;
  v_expires_at timestamptz;
  v_guest_token text := encode(gen_random_bytes(24), 'hex');
begin
  if p_ends_at not in (p_starts_at + interval '1 hour', p_starts_at + interval '2 hours') then raise exception 'invalid_booking_interval' using errcode = '22023'; end if;
  select c.location_id into v_location_id from public.courts c where c.id = p_court_id and c.organization_id = p_organization_id and c.is_active;
  if v_location_id is null then raise exception 'court_not_found' using errcode = 'P0002'; end if;
  select o.initial_hold_minutes, o.max_booking_hours into v_hold_minutes, v_max_booking_hours from public.organizations o where o.id = p_organization_id and o.is_active;
  if v_hold_minutes is null then raise exception 'organization_not_found' using errcode = 'P0002'; end if;
  if p_ends_at > p_starts_at + make_interval(hours => v_max_booking_hours) then raise exception 'booking_duration_not_allowed' using errcode = '22023'; end if;
  update public.bookings as b
  set status = 'expired', updated_at = now()
  where b.court_id = p_court_id
    and b.status in ('held', 'pending_payment_review')
    and b.hold_expires_at <= now();
  v_expires_at := now() + make_interval(mins => v_hold_minutes);
  begin
    insert into public.bookings (organization_id, location_id, court_id, starts_at, ends_at, hold_expires_at, customer_name, customer_email, customer_phone, player_count, amount_minor, currency, guest_token_hash)
    values (p_organization_id, v_location_id, p_court_id, p_starts_at, p_ends_at, v_expires_at, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone), p_player_count, p_amount_minor, upper(p_currency), digest(v_guest_token, 'sha256'))
    returning id, bookings.reference into v_booking_id, v_reference;
  exception when exclusion_violation then raise exception 'slot_unavailable' using errcode = 'P0001'; end;
  insert into public.audit_logs (organization_id, action, entity_type, entity_id, after_data) values (p_organization_id, 'booking.hold_created', 'booking', v_booking_id, jsonb_build_object('hold_expires_at', v_expires_at));
  return query select v_booking_id, v_reference, v_expires_at, v_guest_token;
end;
$$;

create or replace function public.submit_manual_payment_proof(
  p_booking_id uuid, p_guest_token text, p_payment_method_id uuid, p_amount_minor integer, p_transaction_reference text,
  p_payer_name text, p_storage_path text, p_mime_type text, p_size_bytes bigint
) returns table (payment_id uuid, review_expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
  v_method public.venue_payment_methods%rowtype;
  v_payment_id uuid;
  v_review_expires_at timestamptz;
  v_review_minutes integer;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null or v_booking.status <> 'held' or v_booking.hold_expires_at <= now() then raise exception 'hold_expired' using errcode = 'P0001'; end if;
  if v_booking.guest_token_hash is null or v_booking.guest_token_hash <> digest(p_guest_token, 'sha256') then raise exception 'invalid_booking_token' using errcode = '42501'; end if;
  select * into v_method from public.venue_payment_methods where id = p_payment_method_id and organization_id = v_booking.organization_id and mode = 'manual' and is_enabled;
  if v_method.id is null then raise exception 'payment_method_unavailable' using errcode = 'P0002'; end if;
  select manual_review_minutes into v_review_minutes from public.organizations where id = v_booking.organization_id;
  v_review_expires_at := now() + make_interval(mins => v_review_minutes);
  insert into public.payments (organization_id, booking_id, payment_method_id, mode, provider, status, amount_expected_minor, amount_received_minor, currency, transaction_reference)
  values (v_booking.organization_id, v_booking.id, v_method.id, 'manual', v_method.provider, 'proof_submitted', v_booking.amount_minor, p_amount_minor, v_booking.currency, trim(p_transaction_reference)) returning id into v_payment_id;
  insert into public.payment_proofs (organization_id, booking_id, payment_id, storage_path, mime_type, size_bytes, payer_name)
  values (v_booking.organization_id, v_booking.id, v_payment_id, p_storage_path, p_mime_type, p_size_bytes, trim(p_payer_name));
  update public.bookings set status = 'pending_payment_review', hold_expires_at = v_review_expires_at, updated_at = now() where id = v_booking.id;
  insert into public.notifications (organization_id, type, title, body, metadata) values (v_booking.organization_id, 'payment_proof_submitted', 'Payment proof awaiting review', v_booking.reference || ' has submitted payment proof.', jsonb_build_object('booking_id', v_booking.id, 'payment_id', v_payment_id));
  return query select v_payment_id, v_review_expires_at;
end;
$$;

create or replace function public.process_paymongo_webhook(p_event_id text, p_event_type text, p_payload jsonb, p_live_mode boolean)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_booking_id uuid;
  v_provider_payment_id text;
  v_amount integer;
  v_payment public.payments%rowtype;
begin
  insert into public.payment_webhook_events (provider, provider_event_id, event_type, live_mode, payload) values ('paymongo', p_event_id, p_event_type, p_live_mode, p_payload) on conflict (provider, provider_event_id) do nothing;
  if not found then return; end if;
  v_booking_id := nullif(p_payload #>> '{data,attributes,data,attributes,metadata,booking_id}', '')::uuid;
  v_provider_payment_id := p_payload #>> '{data,attributes,data,id}';
  v_amount := nullif(p_payload #>> '{data,attributes,data,attributes,amount}', '')::integer;
  if v_booking_id is null then
    insert into public.payment_exceptions (type, details) values ('unknown_payment', jsonb_build_object('event_id', p_event_id));
  elsif p_event_type in ('payment.paid', 'checkout_session.payment.paid') then
    select * into v_payment from public.payments where booking_id = v_booking_id and provider = 'paymongo' order by created_at desc limit 1 for update;
    if v_payment.id is null then
      insert into public.payment_exceptions (booking_id, type, details) values (v_booking_id, 'unknown_payment', jsonb_build_object('event_id', p_event_id, 'provider_payment_id', v_provider_payment_id));
    elsif v_amount is distinct from v_payment.amount_expected_minor then
      update public.payments set status = 'paid_booking_conflict', amount_received_minor = v_amount, updated_at = now() where id = v_payment.id;
      insert into public.payment_exceptions (organization_id, booking_id, payment_id, type, details) values (v_payment.organization_id, v_booking_id, v_payment.id, 'amount_mismatch', jsonb_build_object('expected', v_payment.amount_expected_minor, 'received', v_amount));
    else
      update public.payments set status = 'paid', amount_received_minor = v_amount, provider_payment_id = coalesce(provider_payment_id, v_provider_payment_id), paid_at = now(), updated_at = now() where id = v_payment.id;
      begin
        update public.bookings set status = 'confirmed', hold_expires_at = null, confirmed_at = now(), updated_at = now() where id = v_booking_id and status in ('held', 'pending_payment_review', 'expired');
      exception when exclusion_violation then
        update public.payments set status = 'paid_booking_conflict', updated_at = now() where id = v_payment.id;
        insert into public.payment_exceptions (organization_id, booking_id, payment_id, type, details) values (v_payment.organization_id, v_booking_id, v_payment.id, 'paid_booking_conflict', jsonb_build_object('event_id', p_event_id));
      end;
    end if;
  elsif p_event_type = 'payment.failed' then
    update public.payments set status = 'failed', updated_at = now() where booking_id = v_booking_id and provider = 'paymongo' and status = 'pending';
  end if;
  update public.payment_webhook_events set processed_at = now() where provider = 'paymongo' and provider_event_id = p_event_id;
end;
$$;

revoke all on function public.create_booking_hold(uuid, uuid, timestamptz, timestamptz, text, text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.create_booking_hold(uuid, uuid, timestamptz, timestamptz, text, text, text, integer, integer, text) to service_role;
revoke all on function public.submit_manual_payment_proof(uuid, text, uuid, integer, text, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.submit_manual_payment_proof(uuid, text, uuid, integer, text, text, text, text, bigint) to service_role;
revoke all on function public.process_paymongo_webhook(text, text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.process_paymongo_webhook(text, text, jsonb, boolean) to service_role;
revoke all on function public.expire_booking_holds() from public, anon, authenticated;
grant execute on function public.expire_booking_holds() to service_role, postgres;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.courts enable row level security;
alter table public.venue_payment_methods enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.payment_exceptions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "members read own memberships" on public.organization_members for select to authenticated using ((select auth.uid()) = user_id);
create policy "members admins manage memberships" on public.organization_members for all to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy "members read organizations" on public.organizations for select to authenticated using (private.is_organization_member(id));
create policy "admins update organizations" on public.organizations for update to authenticated using (private.is_organization_admin(id)) with check (private.is_organization_admin(id));
create policy "members read locations" on public.locations for select to authenticated using (private.is_organization_member(organization_id));
create policy "admins manage locations" on public.locations for all to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy "members read courts" on public.courts for select to authenticated using (private.is_organization_member(organization_id));
create policy "admins manage courts" on public.courts for all to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy "members read payment methods" on public.venue_payment_methods for select to authenticated using (private.is_organization_member(organization_id));
create policy "admins manage payment methods" on public.venue_payment_methods for all to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy "members read bookings" on public.bookings for select to authenticated using (private.is_organization_member(organization_id));
create policy "members manage bookings" on public.bookings for update to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id));
create policy "members read payments" on public.payments for select to authenticated using (private.is_organization_member(organization_id));
create policy "admins manage payments" on public.payments for update to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy "members read proofs" on public.payment_proofs for select to authenticated using (private.is_organization_member(organization_id));
create policy "members read exceptions" on public.payment_exceptions for select to authenticated using (organization_id is not null and private.is_organization_member(organization_id));
create policy "members read notifications" on public.notifications for select to authenticated using (private.is_organization_member(organization_id));
create policy "members update notifications" on public.notifications for update to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id));
create policy "admins read audit log" on public.audit_logs for select to authenticated using (private.is_organization_admin(organization_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "staff read payment proof objects" on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and exists (select 1 from public.payment_proofs p where p.storage_path = name and private.is_organization_member(p.organization_id)));

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.courts to authenticated;
grant select, insert, update, delete on public.venue_payment_methods to authenticated;
grant select, update on public.bookings to authenticated;
grant select, update on public.payments to authenticated;
grant select on public.payment_proofs, public.payment_exceptions, public.audit_logs to authenticated;
grant select, update on public.notifications to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage on schema private to service_role;
grant execute on function private.is_organization_member(uuid), private.is_organization_admin(uuid) to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'expire-booking-holds') then
    perform cron.schedule('expire-booking-holds', '* * * * *', 'select public.expire_booking_holds();');
  end if;
end $$;

commit;
