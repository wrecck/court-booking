insert into public.organizations (id, name, slug, currency, timezone, initial_hold_minutes, manual_review_minutes)
values ('11111111-1111-4111-8111-111111111111', 'Baseline Racquet Club', 'baseline', 'PHP', 'Asia/Manila', 15, 45)
on conflict (id) do nothing;

insert into public.locations (id, organization_id, name, address, timezone)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Baseline Makati', '214 Chino Roces Avenue, Makati', 'Asia/Manila')
on conflict (id) do nothing;

insert into public.courts (id, organization_id, location_id, name, surface, is_indoor, sort_order) values
('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Centre Court', 'Hard', false, 1),
('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Court Two', 'Hard', false, 2),
('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Garden Court', 'Synthetic', false, 3),
('33333333-3333-4333-8333-333333333334', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Covered Court', 'Hard', true, 4)
on conflict (id) do nothing;

insert into public.venue_payment_methods (id, organization_id, type, mode, provider, display_name, account_name, account_number, bank_name, instructions, is_enabled, display_order) values
('44444444-4444-4444-8444-444444444441', '11111111-1111-4111-8111-111111111111', 'ewallet', 'manual', 'gcash', 'GCash transfer', 'Baseline Racquet Club', '09171234567', null, 'Send the exact amount and upload your receipt.', true, 1),
('44444444-4444-4444-8444-444444444442', '11111111-1111-4111-8111-111111111111', 'bank_transfer', 'manual', 'bdo', 'BDO bank transfer', 'Baseline Racquet Club Inc.', '0012345674821', 'BDO', 'Include your booking reference in the transfer note.', true, 2)
on conflict (id) do nothing;
