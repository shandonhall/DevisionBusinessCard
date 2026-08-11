# Connect Platform

White-label, multi-tenant digital business card SaaS for DeVision Media.

Source of truth: [`projectplan.md`](./projectplan.md)  
Architecture: [`docs/architecture.md`](./docs/architecture.md)

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + accessible UI primitives
- Supabase (Auth, PostgreSQL, RLS)
- Zod validation + Vitest

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Apply migrations in order in the Supabase SQL editor (or CLI):
#   1) supabase/migrations/20260310140000_organisations_memberships.sql
#   2) supabase/migrations/20260310143000_brand_kits.sql
#   3) supabase/migrations/20260310150000_brands_locations_employees.sql
#   4) supabase/migrations/20260310160000_cards.sql
#   5) supabase/migrations/20260310170000_publishing.sql
npm run dev
```

### Core flow

1. Apply all migrations to your Supabase project.
2. Sign up / sign in.
3. Configure brand kit, add brands → locations → employees.
4. Publish cards at `/dashboard/cards`.
5. Open the public URL `/{orgSlug}/{cardSlug}` without signing in.
6. To grant platform admin: set `profiles.is_platform_admin = true` for that user in Supabase, then open `/admin`.

## Local hosting (preview what is built)

You can run the app locally **right now**:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### What works without Supabase
- Marketing home page
- `/api/health`
- UI stubs and dashboard shells (auth-gated pages redirect to sign-in)

### What needs Supabase configured
Fill these in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Then apply migrations **1 → 6** (through publishing) in the Supabase SQL editor. After that you can:

1. Sign up at `/auth/sign-up`
2. Add brand / team / publish a card
3. Open the public card URL and test Save contact / Share / QR
4. Pause a card or change its slug and confirm unavailable / redirect behaviour
5. Preview drafts at `/dashboard/cards/[cardId]/preview`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (includes tenant isolation helpers) |
| `npm run typecheck` | TypeScript |

## Environment

See `.env.example` (names only). Never commit secrets.

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_PLATFORM_NAME` | Product display name |
| `NEXT_PUBLIC_APP_URL` | Absolute app URL (auth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only - never expose to the browser |

## Milestone status

- **Milestone 0** - Foundation (complete)
- **Milestone 1** - Authentication + Tenancy (complete in code; requires Supabase + migration)
- **Milestone 2** - Organisation + Brand Kit (complete in code; requires brand_kits migration)
- **Milestone 3** - Structure: brands, locations, employees (complete in code; requires structure migration)
- **Milestone 4** - Public card renderer + publishing (complete in code; requires cards migration)
- **Milestone 5** - Card actions: vCard, share, copy, QR (complete)
- **Milestone 6** - Publishing polish: draft/active/paused/archived, slug redirects, admin preview (complete in code; requires publishing migration)
- **Next** - Milestone 7: Lead capture - awaiting approval

## Security notes

- Private tables use RLS.
- Server helpers in `src/lib/auth/session.ts` and `src/lib/permissions/tenancy.ts` re-check access.
- Cross-tenant access must fail - covered by unit tests for permission helpers; RLS policies enforce the same rules in Postgres.
