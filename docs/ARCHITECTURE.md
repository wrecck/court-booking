# Courtly architecture

## Booking invariant

Every active reservation is represented in `bookings`. PostgreSQL owns the final availability decision through a GiST exclusion constraint on `(court_id, tstzrange(starts_at, ends_at))` for `held`, `pending_payment_review`, and `confirmed` statuses.

The public calendar is advisory. A slot is only owned after `create_booking_hold` completes. That RPC expires stale holds for the selected court and inserts the new hold in the same transaction. Concurrent inserts cannot both succeed.

## Payment paths

- Automatic GCash: create the hold, create a provider payment attempt, redirect to checkout, and confirm from a signed webhook.
- Manual GCash or bank transfer: create the same hold, display all enabled recipient instructions, upload proof to the private `payment-proofs` bucket, and extend the hold for admin review.
- Changing payment methods never creates a second hold.

`payment_status` is separate from `booking_status`. This is intentional: a payment can succeed after its booking hold expires, producing `paid_booking_conflict` and an operational exception rather than overwriting another player's reservation.

## Trust boundaries

- Browser clients never receive the Supabase secret key or payment gateway secrets.
- Guest booking and proof-upload mutations pass through validated Next.js route handlers.
- Staff reads are protected with RLS and organization membership policies.
- Privileged RPCs revoke default `PUBLIC`, `anon`, and `authenticated` execution; only server credentials can call them.
- The manual review RPC explicitly verifies `auth.uid()` and an admin/owner membership even though it runs as `security definer`.
- Proof objects are private and staff access is tied to a matching proof record and organization membership.

## Hold expiry

Supabase Cron calls `expire_booking_holds()` every minute. Hold creation also expires stale rows for its court before attempting insertion, so availability does not depend solely on the scheduler.

## Multi-tenancy

Tenant-owned records carry `organization_id`. RLS policies derive staff access from `organization_members`; user-editable metadata is never used for authorization.
