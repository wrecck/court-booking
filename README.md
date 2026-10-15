# Courtly

Multi-tenant court booking and payment MVP built with Next.js 16, TypeScript, Vercel, PostgreSQL, and Supabase.

## Included

- Customer court/date/time booking flow
- A shared 15-minute hold across automatic and manual payment methods
- Manual GCash and bank-transfer proof upload
- Automatic GCash webhook boundary for PayMongo
- Venue dashboard, bookings calendar, payment-review queue, and payment settings
- PostgreSQL exclusion constraint preventing overlapping active bookings
- Hold expiry through Supabase Cron plus transaction-time cleanup
- Multi-tenant RLS and private proof storage
- Idempotent webhook event storage and payment-conflict handling
- Seed venue and unit tests for booking validation
- Self-service venue registration and email verification
- `/book/{slug}` public booking pages with real court holds and proof upload
- Tenant-scoped dashboard and `/platform` operator console

The marketing page and `/demo/admin` remain a visual demo. `/book/{slug}` uses Supabase records and creates real booking holds. Legacy `/tenant/{slug}` links permanently redirect to the new booking route. Automatic GCash checkout requires a verified gateway and is not enabled in the tenant payment flow yet.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev -- --hostname 127.0.0.1
```

Add the values from the Supabase project **Connect** dialog:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Never prefix the secret key with `NEXT_PUBLIC_`.

## Database

Install the Supabase CLI, link the intended project, and apply migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For local Supabase development:

```bash
supabase start
supabase db reset
```

The reset command applies `supabase/migrations` and then `supabase/seed.sql`.

## PayMongo

Automatic GCash remains hidden until a venue has a verified provider account. Configure the signed webhook endpoint at:

```text
POST /api/webhooks/paymongo
```

Add these server-only variables when enabling it:

```text
PAYMONGO_WEBHOOK_SECRET
PAYMONGO_LIVE_MODE
```

Manual GCash and bank transfer do not require a gateway account.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the booking invariant, payment state design, and trust boundaries.

## Routes

- `/` — product landing page
- `/book/baseline` — customer booking prototype
- `/demo/admin` — public sample admin overview
- `/admin` — venue overview
- `/admin/bookings` — court calendar
- `/admin/payments` — manual-proof review
- `/admin/settings/payments` — payment-method and hold settings
- `/login` — Supabase staff login
- `/register` — register a new venue
- `/register/complete` — fallback setup for accounts created before automatic provisioning
- `/book/{slug}` — each venue's own booking page
- `/platform` — operator-only list of venues and hold settings

Add your production URL (`https://court-booking-rho-navy.vercel.app/auth/callback`) to Supabase Auth redirect URLs for email verification. Newly registered venues start with a single court at ₱500 per hour; owners can add manual GCash and bank recipients in `/admin/settings/payments`. The existing Baseline venue owner is bootstrapped as the platform operator.
