# Architecture notes

**Product working title:** Connect Platform  
**Operator:** DeVision Media  
**Source of truth:** [`projectplan.md`](../projectplan.md)

## Tenancy model

```text
Platform
└── Organisation
    ├── Brands
    │   └── Locations
    │       └── Employees
    │           └── Cards
    ├── Brand kits (inherited styling)
    ├── Memberships / roles
    ├── Leads (tenant-private)
    ├── Analytics
    └── Domains (later)
```

Organisations are never hard-coded in application logic. Branding resolves through design tokens (CSS variables), not per-client stylesheets or `if (org === "…")` branches.

## Brand inheritance (planned)

1. Platform defaults  
2. Organisation defaults  
3. Brand kit  
4. Location overrides  
5. Card overrides  

Most cards should inherit - avoid duplicating design fields on every card.

## Supabase boundaries

| Client | Key | RLS | Where |
|--------|-----|-----|--------|
| Browser (`lib/supabase/client.ts`) | anon | Yes | Client Components |
| Server (`lib/supabase/server.ts`) | anon + cookies | Yes | Server Components / Actions / Route Handlers |
| Admin (`lib/supabase/admin.ts`) | service role | Bypassed | Server-only trusted jobs |

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser or bundled into client modules (`server-only` guard).

## Milestone map

| Milestone | Focus |
|-----------|--------|
| **0** | Foundation |
| **1** | Auth, organisations, memberships, RLS, protected dashboard |
| **2** | Brand kits + theme tokens + logo upload + live preview |
| **3** | Brands / locations / employees + search/filter |
| **4** | Public card renderer (3 layouts) + card publishing |
| **5** | Card actions (vCard, share, copy link, QR) |
| 6+ | Publishing polish, leads, analytics, import, hardening |

## Milestone 1 tenancy

Tables (see `supabase/migrations/20260310140000_organisations_memberships.sql`):

- `profiles` - 1:1 with `auth.users`; `is_platform_admin` for DeVision operators
- `organisations` - tenants (slug for public URLs later)
- `memberships` - user ↔ organisation role

SQL helpers used by RLS: `is_platform_admin()`, `is_org_member(org_id)`, `has_org_role(org_id, roles[])`.

App-layer checks (never rely on UI alone):

- `src/lib/permissions/tenancy.ts` - pure functions (unit tested)
- `src/lib/auth/session.ts` - `requireAuthContext`, `requirePlatformAdmin`, `requireOrganisationAccess`

## Milestone 2 branding

Tables / storage (see `supabase/migrations/20260310143000_brand_kits.sql`):

- `brand_kits` - organisation-scoped design tokens (`brand_id` nullable until M3)
- `organisations.default_brand_kit_id`
- Storage bucket `organisation-assets` with path `{organisation_id}/logos/*`

Token resolution (`src/lib/branding/tokens.ts`):

1. Platform defaults  
2. Organisation default brand kit  
3. Brand kit (later)  
4. Location overrides (later)  
5. Card overrides (later)

Dashboard routes:

- `/dashboard/brand` - kit editor + live mobile preview  
- `/dashboard/settings` - organisation profile fields  

## Milestone 3 structure

Tables (see `supabase/migrations/20260310150000_brands_locations_employees.sql`):

- `brands` - org-scoped, unique `(organisation_id, slug)`
- `locations` - belong to a brand, unique `(organisation_id, slug)`
- `employees` - belong to org; optional `brand_id` / `location_id` with server-side ownership checks

Dashboard routes:

- `/dashboard/brands`
- `/dashboard/locations`
- `/dashboard/team` (search + brand/location/status filters)

Phone numbers are normalised toward E.164 with a configurable default country calling code (not hard-coded to South Africa-only input).

## Milestone 4 public cards

Tables / RPC (see `supabase/migrations/20260310160000_cards.sql`):

- `cards` - one card per employee, unique `(organisation_id, slug)`
- `card_sections` - ordered enabled sections
- `get_public_card(org_slug, card_slug)` - security definer RPC for anonymous reads of **active** cards only

Public route: `/{organisationSlug}/{cardSlug}`

Layouts share `PublicCardRenderer` + section primitives:

- Executive
- Corporate
- Modern

Branding resolves platform → organisation kit → brand kit → card kit override.

Dashboard: `/dashboard/cards` to publish/edit layout and status. `/dashboard/my-card` lets linked employees update their own details and photo. Admins upload photos and can link a login on Team.

**Website brand import (Brand kit):** paste a public https URL → server fetches HTML (SSRF-safe) → suggests colours / fonts / logo into the kit editor. User reviews live preview and saves.

## Milestone 5 card actions

- Save contact → `/api/vcard/{org}/{card}` downloads `.vcf` (label as `vcard_download`)
- Share → Web Share API with copy-link fallback
- Copy link
- QR mode → `/{org}/{card}/qr` fullscreen scannable view

Contact row actions (call / email / WhatsApp / website / LinkedIn) remain in shared section primitives used by all layouts.

## Milestone 6 publishing

Tables / RPC (see `supabase/migrations/20260310170000_publishing.sql`):

- `card_slug_redirects` - maps old card slugs → current slug within an organisation
- `resolve_public_card(org_slug, card_slug)` - returns `active` | `paused` | `redirect` | `missing`

Public behaviour:

| Status | Public URL |
|--------|------------|
| draft / archived | 404 |
| active | render card |
| paused | unavailable page (no private content) |

Slug changes write redirect rows so printed QR / NFC links keep resolving (`308` permanent redirect).

Admin preview: `/dashboard/cards/[cardId]/preview` (org admin) renders draft/paused cards without publishing them.

Dashboard cards manager surfaces Preview links and status help text.

## Security principles

- Every private table is tenant-scoped.
- RLS + server-side permission checks (never UI-only).
- Validate all server inputs (Zod).
- No arbitrary HTML; only safe URL protocols.
- Secrets live in environment variables; `.env.example` has names only.

## Staging / production

- Separate Supabase projects per environment.
- Deploy web app via Vercel (`vercel.json` present).
- Local: copy `.env.example` → `.env.local` and fill values.
