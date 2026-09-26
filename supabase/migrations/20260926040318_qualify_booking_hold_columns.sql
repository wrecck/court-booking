create or replace function public.create_booking_hold(
  p_organization_id uuid, p_court_id uuid, p_starts_at timestamptz, p_ends_at timestamptz,
  p_customer_name text, p_customer_email text, p_customer_phone text, p_player_count integer,
  p_amount_minor integer, p_currency text
) returns table (booking_id uuid, reference text, hold_expires_at timestamptz, guest_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  v_hold_minutes integer;
  v_location_id uuid;
  v_booking_id uuid;
  v_reference text;
  v_expires_at timestamptz;
  v_guest_token text := encode(gen_random_bytes(24), 'hex');
begin
  if p_ends_at <= p_starts_at or p_ends_at > p_starts_at + interval '4 hours' then
    raise exception 'invalid_booking_interval' using errcode = '22023';
  end if;

  select c.location_id into v_location_id
  from public.courts as c
  where c.id = p_court_id
    and c.organization_id = p_organization_id
    and c.is_active;

  if v_location_id is null then
    raise exception 'court_not_found' using errcode = 'P0002';
  end if;

  select o.initial_hold_minutes into v_hold_minutes
  from public.organizations as o
  where o.id = p_organization_id
    and o.is_active;

  if v_hold_minutes is null then
    raise exception 'organization_not_found' using errcode = 'P0002';
  end if;

  update public.bookings as b
  set status = 'expired', updated_at = now()
  where b.court_id = p_court_id
    and b.status in ('held', 'pending_payment_review')
    and b.hold_expires_at <= now();

  v_expires_at := now() + make_interval(mins => v_hold_minutes);

  begin
    insert into public.bookings (
      organization_id, location_id, court_id, starts_at, ends_at, hold_expires_at,
      customer_name, customer_email, customer_phone, player_count, amount_minor,
      currency, guest_token_hash
    ) values (
      p_organization_id, v_location_id, p_court_id, p_starts_at, p_ends_at,
      v_expires_at, trim(p_customer_name), lower(trim(p_customer_email)),
      trim(p_customer_phone), p_player_count, p_amount_minor, upper(p_currency),
      digest(v_guest_token, 'sha256')
    )
    returning id, bookings.reference into v_booking_id, v_reference;
  exception
    when exclusion_violation then
      raise exception 'slot_unavailable' using errcode = 'P0001';
  end;

  insert into public.audit_logs (
    organization_id, action, entity_type, entity_id, after_data
  ) values (
    p_organization_id, 'booking.hold_created', 'booking', v_booking_id,
    jsonb_build_object('hold_expires_at', v_expires_at)
  );

  return query
  select v_booking_id, v_reference, v_expires_at, v_guest_token;
end;
$$;

revoke all on function public.create_booking_hold(
  uuid, uuid, timestamptz, timestamptz, text, text, text, integer, integer, text
) from public, anon, authenticated;

grant execute on function public.create_booking_hold(
  uuid, uuid, timestamptz, timestamptz, text, text, text, integer, integer, text
) to service_role;
