begin;

create or replace function public.review_manual_payment(p_payment_id uuid, p_approve boolean, p_reason text default null)
returns public.booking_status
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select * into v_payment from public.payments where id = p_payment_id and mode = 'manual' for update;
  if v_payment.id is null then raise exception 'payment_not_found' using errcode = 'P0002'; end if;
  if not private.is_organization_admin(v_payment.organization_id) then raise exception 'insufficient_permission' using errcode = '42501'; end if;
  if v_payment.status <> 'proof_submitted' then raise exception 'payment_already_reviewed' using errcode = 'P0001'; end if;
  select * into v_booking from public.bookings where id = v_payment.booking_id for update;

  if p_approve then
    begin
      update public.bookings set status = 'confirmed', hold_expires_at = null, confirmed_at = now(), updated_at = now() where id = v_booking.id;
    exception when exclusion_violation then
      update public.payments set status = 'paid_booking_conflict', approved_by = v_user_id, approved_at = now(), updated_at = now() where id = v_payment.id;
      insert into public.payment_exceptions (organization_id, booking_id, payment_id, type, details) values (v_payment.organization_id, v_booking.id, v_payment.id, 'paid_booking_conflict', jsonb_build_object('source', 'manual_review'));
      raise exception 'slot_no_longer_available' using errcode = 'P0001';
    end;
    update public.payments set status = 'paid', paid_at = now(), approved_by = v_user_id, approved_at = now(), updated_at = now() where id = v_payment.id;
    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, after_data) values (v_payment.organization_id, v_user_id, 'payment.approved', 'payment', v_payment.id, jsonb_build_object('booking_id', v_booking.id));
    return 'confirmed';
  end if;

  if nullif(trim(p_reason), '') is null then raise exception 'rejection_reason_required' using errcode = '22023'; end if;
  update public.payments set status = 'rejected', approved_by = v_user_id, approved_at = now(), rejection_reason = trim(p_reason), updated_at = now() where id = v_payment.id;
  update public.bookings set status = 'cancelled', hold_expires_at = null, cancelled_at = now(), updated_at = now() where id = v_booking.id;
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, after_data) values (v_payment.organization_id, v_user_id, 'payment.rejected', 'payment', v_payment.id, jsonb_build_object('booking_id', v_booking.id, 'reason', trim(p_reason)));
  return 'cancelled';
end;
$$;

revoke all on function public.review_manual_payment(uuid, boolean, text) from public, anon;
grant execute on function public.review_manual_payment(uuid, boolean, text) to authenticated;

commit;
