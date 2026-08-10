# Cursor Build Prompt: White-Label Digital Business Card Platform

You are helping me build a production-quality multi-tenant white-label digital business card SaaS platform.

Before writing code, read the `projectplan.md` file in the repository root in full. Treat it as the source of truth for product scope, architecture, security principles and development sequence.

## Core product goal

The product allows me to onboard organisations through an admin dashboard, configure their logo, colours, typography and card style, add brands/locations/employees, and generate premium mobile-first digital business cards without changing code for each client.

Each organisation must feel fully branded to the client while running on the same underlying platform.

The product must eventually support custom domains, lead capture, analytics, CRM integration, QR/NFC sharing, Wallet passes and more, but we are NOT building all of that immediately.

## Non-negotiable architecture

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or similarly accessible reusable components
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security

Do not hard-code a client or organisation into the application.

Use a true multi-tenant model.

The conceptual hierarchy is:

Platform
→ Organisation
→ Brand
→ Location
→ Employee
→ Card

Brand/style inheritance should work:

Platform defaults
→ Organisation defaults
→ Brand kit
→ Location overrides
→ Card overrides

Most cards should use inherited styling rather than storing duplicate design values.

Use CSS variables/design tokens for runtime branding rather than separate CSS files per client.

## Security rules

Security is a launch-blocking requirement.

- Every private table must be tenant scoped.
- Implement RLS policies.
- Also validate permissions server-side.
- A user from Organisation A must never access Organisation B by changing URLs, IDs or API parameters.
- Never expose Supabase service-role credentials to the browser.
- Never trust client-side validation alone.
- Validate all server inputs.
- Do not accept arbitrary HTML or unsafe URLs.
- Keep leads private to the correct tenant.
- Keep secrets in environment variables.
- Create `.env.example` with names only.
- Never commit real secrets.

## Development approach

Do NOT attempt the entire project in one response or one giant code generation pass.

Work milestone by milestone.

At the beginning of each milestone:

1. Inspect the current repository.
2. Read `projectplan.md`.
3. Summarise what already exists.
4. State the exact files you intend to create/change.
5. Identify any database migration required.
6. Implement only the milestone.
7. Run lint/typecheck/tests/build.
8. Fix errors before proceeding.
9. Summarise what changed.
10. Stop and wait for me before beginning the next milestone.

Do not silently expand scope.

Do not make destructive database changes without explaining them.

## Milestone 0: Foundation

Start with Milestone 0 only.

Create or configure:

- Next.js application
- TypeScript
- Tailwind CSS
- accessible UI component baseline
- sensible repository folder structure
- Supabase client setup
- server/client Supabase helpers
- environment variable validation
- `.env.example`
- linting
- formatting
- basic test setup
- README
- architecture notes
- health/home page
- staging-ready deployment structure

Recommended structure:

```text
/
├── app/
│   ├── (public)/
│   ├── admin/
│   ├── dashboard/
│   ├── auth/
│   └── api/
├── components/
│   ├── cards/
│   ├── card-sections/
│   ├── admin/
│   ├── forms/
│   ├── analytics/
│   ├── branding/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── analytics/
│   ├── domains/
│   ├── permissions/
│   ├── qr/
│   ├── vcard/
│   ├── validation/
│   └── utils/
├── types/
├── hooks/
├── public/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies/
├── tests/
├── scripts/
└── docs/
```

Adjust this only if there is a clear technical reason.

## Initial database foundation

For the first database milestone, prepare for these tables:

### organisations

- id
- name
- slug
- legal_name
- website
- status
- default_brand_id nullable
- plan_id nullable
- white_label_enabled
- created_at
- updated_at

### memberships

- id
- user_id
- organisation_id
- brand_id nullable
- location_id nullable
- role
- created_at

Do not prematurely create the full production schema if it makes the first milestone harder to validate. We will add the rest through migrations.

## Authentication

Prepare architecture for:

- authenticated dashboard
- platform super admin
- organisation admin
- employee/card owner

Initial implementation can start with organisation admin authentication.

Do not rely on frontend role checks alone.

## Coding standards

- Strict TypeScript.
- Avoid `any` unless there is a documented reason.
- Keep functions small.
- Prefer reusable components.
- Use meaningful names.
- Avoid giant components.
- Keep server-only code clearly separated.
- Add comments for non-obvious security or tenancy logic, not obvious syntax.
- Prefer composition over duplication.
- Keep public card rendering independent from dashboard forms.
- Use schema migrations for database changes.
- Do not modify production data manually as part of normal development.

## UI direction

The dashboard should feel premium, modern and clean.

Use:

- strong spacing
- minimal clutter
- accessible contrast
- consistent components
- polished empty states
- clear hierarchy

Do not over-design the first milestone.

The future public cards will be visually premium, but right now prioritise architecture and reliability.

## White-label requirement

Never implement client styling like:

```ts
if (organisation === "BUTEC") {
  // special styling
}
```

Instead implement structured organisation/brand configuration.

The eventual system must be able to onboard a brand-new client completely through the admin dashboard.

## Data model rules

IDs should be stable internal identifiers.

Public URLs should use slugs, not raw database IDs.

Plan for durable redirects so changing a card slug later does not break printed QR codes.

Store phone numbers in a normalised international format when possible.

Do not assume South African phone numbers only, even though South Africa is the first market.

## POPIA / privacy

The platform will process personal data and lead/contact information.

Design for:

- data minimisation
- clear consent
- tenant-private leads
- deletion
- retention
- auditability
- secure exports

Do not invent final legal copy. Use clearly labelled placeholders where legal wording is required.

## Future features to prepare for, not build now

Do not implement these in Milestone 0:

- NFC management
- Apple Wallet
- Google Wallet
- billing
- CRM integrations
- event mode
- AI brand extraction
- advanced analytics
- external public API
- email signature manager
- SSO

However, do not make architectural decisions that obviously prevent these later.

## First action

Start by inspecting the repository.

If the repository is empty, initialise the project using the agreed stack.

Then show me:

1. the proposed folder structure,
2. the packages you intend to use and why,
3. the initial environment variables required,
4. the Milestone 0 implementation plan.

After that, begin implementing Milestone 0.

Do not move on to Milestone 1 until Milestone 0 builds cleanly and I approve continuing.
