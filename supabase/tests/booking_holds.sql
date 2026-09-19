begin;
select plan(3);

select has_table('public', 'bookings', 'bookings table exists');
select has_function('public', 'create_booking_hold', array['uuid','uuid','timestamp with time zone','timestamp with time zone','text','text','text','integer','integer','text'], 'hold RPC exists');
select col_is_unique('public', 'bookings', 'reference', 'booking references are unique');

select * from finish();
rollback;
