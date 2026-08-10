# White-Label Digital Business Card Platform
## Project Plan

**Working title:** Connect Platform  
**Project type:** Multi-tenant, white-label SaaS web application  
**Primary use case:** Branded digital business cards for organisations, teams, branches and individual staff members  
**Primary operator:** DeVision Media  
**Initial internal client:** DeVision Media  
**Primary development environment:** Cursor  
**Status:** Pre-development planning  
**Document purpose:** Define the product, architecture, user experience, data model, security model, implementation sequence and acceptance criteria before development begins.

---

# 1. Product Vision

Build a premium white-label digital identity and business-card platform that allows DeVision Media to onboard organisations quickly, apply their brand identity, create cards for employees, publish cards to shareable URLs and QR codes, capture leads, and measure engagement.

The product must not feel like a generic digital business-card template. Each client should feel as though the platform was built for their own organisation.

The platform should be designed so that onboarding a new client does **not** require editing code.

The long-term product should support:

- Fully branded employee digital cards
- Organisation and brand-level theme management
- Multiple brands and locations within a parent organisation
- Employee management
- QR sharing
- NFC sharing
- Native phone sharing
- Contact saving via vCard
- Lead/contact exchange
- Analytics
- CRM integrations
- Custom domains
- Event-specific cards and campaigns
- Apple Wallet and Google Wallet passes
- Branded email signatures
- Bulk staff imports
- Team and organisation reporting
- White-label administration
- Subscription and package management

The first release should focus on a commercially viable, stable, mobile-first core.

---

# 2. Product Positioning

The platform should be positioned as:

> A white-label digital identity and networking platform that turns real-world introductions into measurable business opportunities.

It should not be positioned only as a replacement for printed business cards.

The main value proposition should combine:

1. **Professional presentation**
2. **Fast contact sharing**
3. **Brand consistency**
4. **Lead capture**
5. **Analytics**
6. **Centralised management**
7. **CRM readiness**
8. **Scalability across teams**

---

# 3. Core Product Principles

## 3.1 No app required

Recipients must be able to open and use a card directly in a mobile browser.

They should not need:

- An account
- An app
- A login
- A special reader
- A subscription

## 3.2 Mobile first

The recipient experience should be designed primarily for smartphones.

Desktop support must still be polished, but mobile takes priority.

## 3.3 White-label first

Every organisation must be able to control:

- Logo
- Colours
- Typography
- Card layout
- Button styling
- Background styling
- Corporate links
- Footer
- Contact information defaults
- Custom domain
- White-label settings

## 3.4 Inheritance over duplication

Brand information should be stored centrally and inherited.

Example:

Organisation → Brand → Location → Employee → Card

A colour change at brand level should update all cards using that brand unless a deliberate override exists.

## 3.5 No code required for client onboarding

Once the platform is operational, onboarding must happen through the admin interface.

## 3.6 Data ownership and portability

Clients should be able to export their:

- Employees
- Cards
- Leads
- Analytics summaries

The system should avoid unnecessary lock-in.

## 3.7 Fast public pages

Public card pages should load quickly and contain minimal JavaScript where possible.

## 3.8 Progressive enhancement

Core functions must still work on devices that do not support every advanced browser capability.

For example:

- Native share can fall back to copy-link
- vCard download must work without native contact APIs
- QR must work independently of NFC
- Custom domains must not be required for the platform to function

---

# 4. User Types

The platform should support the following user roles.

## 4.1 Platform Super Admin

DeVision Media internal administrator.

Capabilities:

- Create organisations
- Disable organisations
- Configure plans/features
- Create brands
- Create locations
- Manage all users
- View all analytics
- View audit logs
- Configure platform settings
- Configure domains
- Manage platform templates
- Troubleshoot cards
- Impersonate organisation admin only if a secure audited support mechanism is intentionally implemented
- Export data
- Manage integrations

## 4.2 Organisation Admin

Client-side administrator.

Capabilities:

- Manage organisation details
- Manage approved brands
- Manage locations/departments
- Manage employees
- Manage card templates
- Configure brand assets
- Manage organisation links
- View organisation analytics
- Export employee and lead data
- Configure approved integrations
- Lock/unlock employee-editable fields
- Bulk import employees
- Archive employees

## 4.3 Brand Admin

Optional future or enterprise role.

Capabilities restricted to one brand within an organisation.

Useful for groups with multiple brands.

## 4.4 Location/Branch Admin

Optional role.

Capabilities restricted to one location or dealership.

## 4.5 Employee/Card Owner

Can manage only fields permitted by organisation policy.

Possible editable fields:

- Profile image
- Bio
- Mobile
- WhatsApp
- Email
- LinkedIn
- Booking link
- Personal links

Possible locked fields:

- Brand colours
- Logo
- Corporate footer
- Company website
- Legal text
- Organisation name
- Certain job titles
- Template

## 4.6 Public Recipient

No account required.

Can:

- View card
- Save contact
- Call
- Email
- Open WhatsApp
- Visit links
- Download documents
- Share card
- View QR
- Submit contact details through exchange form

---

# 5. Multi-Tenant Architecture

The application must be a true multi-tenant system.

Each organisation is isolated logically and at the database access level.

Recommended hierarchy:

```text
Platform
└── Organisation
    ├── Brands
    │   └── Locations
    │       └── Employees
    │           └── Cards
    ├── Brand Kits
    ├── Organisation Users
    ├── Leads
    ├── Analytics
    ├── Domains
    ├── Integrations
    └── Settings
```

Example automotive hierarchy:

```text
AGG
├── JAC
│   ├── Sandton
│   ├── Roodepoort
│   └── Northcliff
├── Geely
│   ├── Ontdekkers
│   └── Northcliff
└── Jetour
    └── Roodepoort
```

Example engineering client:

```text
BUTEC South Africa
└── BUTEC
    └── Johannesburg
        ├── Tim Scholtz
        ├── Elsie Rudolph
        └── Leonard Harmse
```

---

# 6. Recommended Technical Stack

The implementation should favour a modern TypeScript web stack.

## Frontend / Application

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or an equivalent accessible component system

## Backend / Data

Recommended initial option:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security

Alternative architecture may use a separate Node backend and PostgreSQL, but the initial product should optimise for development speed and maintainability.

## Hosting

Recommended:

- Vercel for the web application
- Supabase for database/auth/storage

## Supporting Services

Potential later additions:

- Transactional email provider
- Error monitoring
- Analytics/observability
- Background job queue
- Image optimisation service
- CRM webhooks
- Payment provider
- Custom-domain automation

Do not hard-code the application to one external provider where an abstraction is easy to maintain.

---

# 7. Environment Structure

Maintain separate environments:

- Local development
- Staging
- Production

Each environment should have separate:

- Database
- Auth
- Storage
- Environment variables
- API keys
- Webhook secrets

Never use production secrets locally.

Create:

```text
.env.example
```

with variable names only.

Never commit real secrets.

---

# 8. Suggested Repository Structure

```text
/
├── app/
│   ├── (public)/
│   │   ├── [organisationSlug]/
│   │   │   └── [cardSlug]/
│   │   └── share/
│   ├── admin/
│   ├── dashboard/
│   ├── auth/
│   ├── api/
│   └── layout.tsx
│
├── components/
│   ├── cards/
│   ├── card-sections/
│   ├── admin/
│   ├── forms/
│   ├── analytics/
│   ├── branding/
│   └── ui/
│
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
│
├── styles/
├── types/
├── hooks/
├── public/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies/
│
├── tests/
├── scripts/
├── docs/
└── middleware.ts
```

Keep feature logic modular.

Avoid giant page files.

---

# 9. Core Database Model

The exact schema may evolve, but the following entities should exist conceptually.

## 9.1 organisations

Fields:

- id
- name
- slug
- legal_name
- website
- status
- default_brand_id
- plan_id
- white_label_enabled
- created_at
- updated_at

## 9.2 organisation_settings

Fields:

- organisation_id
- allow_employee_title_edit
- allow_employee_photo_edit
- allow_employee_bio_edit
- allow_employee_social_edit
- allow_employee_custom_links
- require_admin_approval
- show_powered_by
- analytics_enabled
- lead_capture_enabled
- privacy_policy_url
- terms_url
- default_country_code
- timezone
- locale

## 9.3 brands

Fields:

- id
- organisation_id
- name
- slug
- status
- website
- logo_asset_id
- logo_dark_asset_id
- logo_light_asset_id
- favicon_asset_id
- brand_kit_id
- created_at

## 9.4 brand_kits

Fields:

- id
- organisation_id
- brand_id
- name
- primary_colour
- secondary_colour
- accent_colour
- background_colour
- surface_colour
- text_colour
- muted_text_colour
- heading_font
- body_font
- button_radius
- card_radius
- border_style
- shadow_style
- background_style
- background_asset_id
- default_layout_id
- custom_css_allowed
- created_at
- updated_at

Avoid unrestricted custom CSS in V1 unless there is a safe and controlled implementation.

## 9.5 locations

Fields:

- id
- organisation_id
- brand_id
- parent_location_id
- name
- slug
- type
- address
- phone
- email
- website
- timezone
- status
- created_at

Location types can include:

- branch
- dealership
- office
- department
- division
- region
- team

## 9.6 employees

Fields:

- id
- organisation_id
- brand_id
- location_id
- user_id nullable
- first_name
- last_name
- display_name
- job_title
- department
- email
- mobile
- whatsapp
- linkedin_url
- profile_photo_asset_id
- bio
- status
- employee_reference
- created_at
- updated_at

## 9.7 cards

Fields:

- id
- organisation_id
- employee_id
- slug
- public_status
- layout_id
- brand_kit_id nullable
- page_title
- meta_description
- primary_cta
- published_at
- expires_at nullable
- created_at
- updated_at

## 9.8 card_sections

Flexible section system.

Fields:

- id
- card_id
- type
- sort_order
- enabled
- config_json
- created_at
- updated_at

Types may include:

- hero
- contact_actions
- about
- social_links
- custom_links
- documents
- gallery
- video
- booking
- products
- services
- testimonials
- qr
- exchange_details

## 9.9 links

Fields:

- id
- organisation_id
- card_id nullable
- location_id nullable
- brand_id nullable
- label
- url
- icon
- type
- sort_order
- enabled
- tracking_enabled

## 9.10 assets

Fields:

- id
- organisation_id
- owner_type
- owner_id
- storage_path
- asset_type
- mime_type
- file_size
- width
- height
- alt_text
- created_at

## 9.11 leads

Fields:

- id
- organisation_id
- card_id
- employee_id
- source_id nullable
- first_name
- last_name
- company
- job_title
- email
- phone
- consent_to_contact
- marketing_consent
- notes
- created_at

Sensitive lead data must have stricter permissions than public card content.

## 9.12 analytics_events

Fields:

- id
- organisation_id
- card_id
- employee_id
- source_id nullable
- session_id
- event_type
- event_target
- referrer
- device_type
- browser_family
- country_code if legally appropriate
- timestamp

Do not store unnecessary personal data.

Event examples:

- card_view
- save_contact
- call_click
- whatsapp_click
- email_click
- link_click
- document_download
- qr_open
- share_click
- exchange_form_open
- exchange_form_submit
- booking_click

## 9.13 tracking_sources

Fields:

- id
- organisation_id
- card_id
- name
- slug
- campaign
- medium
- source
- created_at

Examples:

- email_signature
- printed_card
- event_mining_indaba_2027
- linkedin
- showroom
- reception

## 9.14 domains

Fields:

- id
- organisation_id
- domain
- type
- status
- verification_token
- ssl_status
- is_primary
- created_at
- verified_at

Types:

- platform
- subdomain
- custom

## 9.15 users

Managed by authentication provider.

Profile metadata may include:

- id
- name
- email
- avatar
- status

## 9.16 memberships

Fields:

- id
- user_id
- organisation_id
- brand_id nullable
- location_id nullable
- role
- created_at

## 9.17 audit_logs

Fields:

- id
- organisation_id
- actor_user_id
- action
- entity_type
- entity_id
- metadata_json
- created_at

Audit:

- employee edits
- card publishing
- brand changes
- imports
- exports
- role changes
- integration changes
- custom-domain changes

## 9.18 integrations

Fields:

- id
- organisation_id
- provider
- status
- config_encrypted
- created_at
- updated_at

Never store sensitive credentials as plain text.

## 9.19 feature_flags / entitlements

Allow features by organisation or plan.

Examples:

- custom_domain
- lead_capture
- analytics
- advanced_analytics
- bulk_import
- crm_sync
- wallet_pass
- event_mode
- custom_templates

---

# 10. Brand Inheritance System

The platform should resolve styling in a predictable order.

Recommended hierarchy:

1. Platform defaults
2. Organisation defaults
3. Brand kit
4. Location override
5. Card override

Avoid employee-level design overrides unless explicitly allowed.

Example token resolution:

```text
resolvedPrimaryColour =
    card.primaryColourOverride
    ?? location.primaryColourOverride
    ?? brandKit.primaryColour
    ?? organisation.primaryColour
    ?? platformDefault
```

The majority of cards should have no overrides.

---

# 11. Design Token System

Use CSS custom properties for runtime white-label styling.

Example:

```css
:root {
  --brand-primary: #111111;
  --brand-secondary: #444444;
  --brand-accent: #ffffff;
  --brand-background: #ffffff;
  --brand-surface: #f7f7f7;
  --brand-text: #111111;
  --brand-muted-text: #6b7280;
  --brand-button-radius: 14px;
  --brand-card-radius: 24px;
}
```

Do not create a separate stylesheet per client.

The theme engine should output safe design tokens.

---

# 12. Card Layout System

V1 should launch with 3 polished layouts.

## 12.1 Executive

Characteristics:

- Minimal
- Premium typography
- Strong whitespace
- Photo-forward
- Professional
- Suitable for senior staff and consultants

## 12.2 Corporate

Characteristics:

- Logo-led
- Structured
- Strong company identity
- Suitable for engineering, finance, legal, industrial and B2B

## 12.3 Modern

Characteristics:

- More visual
- Branded gradients/backgrounds
- Slight motion
- Suitable for agencies, technology, automotive and creative industries

Later:

- Luxury
- Automotive
- Event
- Portfolio
- Minimal
- Sales-focused

Layouts should use the same underlying data.

---

# 13. Public Card Experience

The card should prioritise actions in this order:

1. Identity
2. Save contact
3. Contact
4. Key CTA
5. Additional content
6. Share

Typical public page:

```text
Logo

Profile Photo

Name
Job Title
Company

[ Save Contact ]

[ Call ] [ WhatsApp ] [ Email ]

Primary CTA

About

Links / Services / Documents

[ Exchange Details ]

[ Show QR ]
[ Share Card ]
```

Important:

- Main interactions must be reachable with one thumb.
- Avoid excessive scrolling.
- Keep visual hierarchy strong.
- Do not hide contact actions in menus.
- Do not use tiny social icons as primary actions.
- Include safe-area handling for modern phones.
- Avoid intrusive popups.

---

# 14. Save Contact / vCard

Generate `.vcf` files dynamically.

Include where available:

- First name
- Last name
- Display name
- Organisation
- Job title
- Mobile
- Work phone
- Email
- Website
- Address
- LinkedIn URL
- Card URL
- Optional image where implementation is reliable

Test on:

- iOS
- Android
- Windows
- macOS

Track save-contact clicks, but do not claim that a user definitely saved the contact merely because the vCard was requested.

Analytics label should reflect the action accurately, e.g.:

`vcard_download`

instead of assuming successful storage.

---

# 15. Sharing

Support:

## Native Web Share

Use native browser share where available.

Share:

- Card URL
- Person name
- Company name
- Short message

## Copy Link fallback

If Web Share is unavailable, copy URL to clipboard.

## QR Share Mode

Dedicated fullscreen view containing:

- Person name
- Organisation
- Large QR
- Short instruction
- Optional logo

Consider optional screen-brightness advice, but browser control of device brightness may not be available.

---

# 16. QR System

QR codes should be dynamic.

The QR should resolve through the application's URL and not encode employee contact data directly.

Benefits:

- Card details can change without reprinting QR
- Tracking can be added
- Destinations can change
- Cards can be disabled
- Event source tags can be supported

Support branded export variants:

- PNG
- SVG
- Print-resolution image

Optional design controls:

- Brand colour
- Logo in centre
- Quiet zone
- Frame
- CTA text

Maintain sufficient QR contrast and readability.

Do not allow brand styling that makes a QR unreliable.

---

# 17. NFC

NFC is a sharing channel, not a separate card.

NFC tag contains a URL.

Example:

```text
https://connect.example.co.za/john-smith
```

Future admin capability:

- Associate NFC identifier with card
- Reassign card
- Disable tag
- Track NFC source separately

Do not build proprietary NFC hardware functionality into V1.

---

# 18. Contact Exchange / Lead Capture

Public user can submit:

- First name
- Last name
- Company
- Job title
- Email
- Phone
- Optional note

The form should display a clear purpose.

Consent controls should be configurable.

Potential flow:

```text
Recipient opens card
→ taps Exchange Details
→ enters details
→ submits
→ confirmation
→ vCard download offered
→ lead stored
→ optional CRM sync
→ optional notification to employee
```

Do not automatically opt users into marketing without valid consent.

---

# 19. POPIA / Privacy Requirements

Because the initial operating market is South Africa, POPIA considerations must be designed into the product.

Minimum requirements:

- Collect only necessary personal information
- Explain what lead information will be used for
- Allow organisation-level privacy policy URL
- Allow optional contact consent checkbox
- Separate marketing consent where appropriate
- Protect exported leads
- Restrict access to leads
- Support lead deletion requests
- Support employee deletion/archive
- Support data retention policy
- Keep audit records
- Use secure storage and encrypted transport
- Do not expose emails/phone numbers through unintended APIs
- Do not collect precise location unless a future use case clearly requires it
- Provide a route for privacy/contact information

Legal wording should be reviewed professionally before commercial launch.

---

# 20. Authentication

V1 authentication:

- Email/password and/or magic-link
- Organisation membership
- Role-based access

Optional later:

- Microsoft SSO
- Google Workspace SSO
- Enterprise SAML

Security:

- Strong password requirements if passwords are used
- Rate limiting
- Session expiry
- Secure cookies
- CSRF protections where applicable
- Email verification
- Account disabling
- Permission checks server-side

Never rely only on hidden UI for access control.

---

# 21. Authorisation / Row-Level Security

Every database operation must verify tenant membership.

A user from Organisation A must never be able to access Organisation B through:

- API manipulation
- guessed IDs
- altered URLs
- frontend state
- direct database requests

RLS policies should cover:

- organisations
- brands
- locations
- employees
- cards
- leads
- analytics
- assets
- integrations
- audit logs

Platform super-admin access must be explicit and audited.

---

# 22. Admin Dashboard

## Platform Admin

Screens:

- Dashboard
- Organisations
- Organisation detail
- Brands
- Users
- Domains
- Templates
- Integrations
- Audit logs
- System settings

## Organisation Admin

Screens:

- Overview
- Team
- Cards
- Brand
- Locations
- Leads
- Analytics
- QR codes
- Domains
- Integrations
- Import/export
- Settings

---

# 23. Organisation Onboarding Wizard

Target onboarding workflow:

## Step 1: Organisation

- Company name
- Slug
- Website
- Country
- Timezone
- Default locale

## Step 2: Brand

- Logo
- Secondary logo
- Primary colour
- Secondary colour
- Accent colour
- Background
- Heading font
- Body font

## Step 3: Style

- Select base card layout
- Button style
- Image style
- Corner radius
- Background option

Live mobile preview should be shown.

## Step 4: Company details

- Main phone
- Main email
- Website
- Social links
- Address
- Privacy policy
- Default CTA

## Step 5: Locations

Optional:

- Branches
- Dealerships
- Departments

## Step 6: People

- Add manually
- CSV import

## Step 7: Review

- Preview organisation
- Preview cards
- Confirm inherited settings

## Step 8: Publish

- Generate URLs
- Generate QR codes
- Send employee invite links if relevant

---

# 24. Employee Creation Flow

Fields:

- First name
- Last name
- Job title
- Department
- Location
- Mobile
- WhatsApp
- Email
- LinkedIn
- Bio
- Profile photo
- Booking link
- Custom links

Generate:

- Card slug
- Public URL
- QR code
- vCard

Slug collision handling is required.

---

# 25. Bulk CSV Import

V1 or early V1.1 should support CSV import.

Import steps:

1. Upload CSV
2. Map columns
3. Validate
4. Preview
5. Identify errors
6. Import valid rows
7. Report failed rows

Common fields:

```text
first_name
last_name
job_title
email
mobile
whatsapp
linkedin_url
department
brand
location
employee_reference
```

System should never silently discard invalid rows.

Provide downloadable error report.

---

# 26. Import / Export

Organisation admins should be able to export:

- Employees
- Leads
- Card status
- Basic analytics

Exports should be scoped to the organisation.

Sensitive exports should be audited.

---

# 27. Analytics

V1 dashboard metrics:

- Card views
- Unique sessions
- vCard downloads
- Call clicks
- WhatsApp clicks
- Email clicks
- Website clicks
- Social clicks
- Share clicks
- QR opens where trackable
- Lead forms opened
- Lead forms submitted
- Document downloads

Breakdowns:

- Employee
- Location
- Brand
- Date range
- Source

Important:

Do not overstate analytics precision.

A click is not necessarily a successful call, saved contact, booking or sale.

---

# 28. Source Tracking

Support query-based source tracking.

Example:

```text
/john-smith?src=email-signature
/john-smith?src=linkedin
/john-smith?src=mining-indaba-2027
```

Store source in session.

Attribution should persist for relevant actions in the same session.

Admin should be able to create named tracking links and QR codes.

---

# 29. Event Mode

Future feature, but design schema for it now.

An event can:

- Temporarily change CTA
- Feature event-specific documents
- Add a badge/banner
- Use event-specific source tracking
- Capture event leads
- Show event analytics

Example:

```text
Mining Indaba 2027
```

Event-specific reporting:

- Views
- Leads
- Downloads
- CTA clicks
- Top staff cards

---

# 30. Custom Domains

Support:

## Platform URLs

```text
connect.yourplatform.co.za/client/person
```

## Client subdomains

```text
client.yourplatform.co.za/person
```

## Premium custom domains

```text
connect.client.co.za/person
```

Host resolution should occur centrally.

Conceptual request flow:

```text
Request host
→ middleware resolves domain
→ identify organisation
→ load organisation theme/settings
→ resolve path to card
```

Domain verification and SSL status must be tracked.

Custom-domain setup must fail safely.

Never show one client's card on another client's domain.

---

# 31. SEO and Privacy of Public Cards

Card pages are public by default, but organisations should be able to decide whether they are indexed by search engines.

Support:

- index / noindex
- Open Graph metadata
- social preview image
- page title
- description
- canonical URL

Some corporate clients may want cards available by direct link but excluded from search engines.

---

# 32. Accessibility

Target WCAG 2.1 AA principles.

Requirements:

- Good colour contrast
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Proper form labels
- Alt text
- Accessible modals
- Reduced motion support
- Text scaling
- Minimum touch target sizing

Brand customisation must not be allowed to create unreadable interfaces.

Consider an automatic contrast warning in the brand editor.

---

# 33. Performance

Public card goals:

- Fast initial render
- Optimised images
- Lazy-load noncritical sections
- Minimal third-party scripts
- Server-render core identity
- Cache public card data safely
- Avoid heavy animation frameworks for simple effects

Dashboard can be heavier than public pages, but should remain responsive.

---

# 34. Media / Asset Management

Support:

- Logos
- Profile photos
- Background images
- Documents
- Social preview images

Validation:

- Allowed MIME types
- Maximum file size
- Image dimensions
- Malware scanning if a suitable service is introduced
- Sanitised filenames
- Signed/private URLs where required

Public documents should be explicitly marked as public.

Do not accidentally expose private client documents from shared storage paths.

---

# 35. Documents

Card owners may eventually attach:

- Company profile
- Brochure
- Portfolio
- Case study
- Catalogue
- Price list
- CV
- Presentation

Document section should support:

- Title
- Description
- File
- Thumbnail
- Download/view CTA
- Tracking

---

# 36. Integrations

Design an adapter pattern.

Potential integrations:

- GoHighLevel
- HubSpot
- Salesforce
- Zapier
- Make
- Webhooks

V1 can start with generic webhooks.

Lead event payload example:

```json
{
  "event": "lead.created",
  "organisationId": "...",
  "cardId": "...",
  "employeeId": "...",
  "lead": {
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "..."
  },
  "source": {
    "name": "Mining Indaba 2027"
  }
}
```

Use signed webhook requests.

Retry failed deliveries safely.

Avoid duplicate lead creation using idempotency keys where possible.

---

# 37. Notifications

Potential notifications:

- New lead captured
- Employee invited
- Employee profile incomplete
- Domain verification required
- Import completed
- Integration failed

Notification preferences should be configurable.

Avoid excessive email noise.

---

# 38. Email White-Labelling

Future/enterprise support:

- Client sender name
- Client reply-to
- Client logo
- Client colours
- Custom email domain where technically and operationally appropriate

V1 transactional emails may be platform-branded unless white-label requirements justify earlier implementation.

---

# 39. Billing / Plans

Billing can be deferred, but entitlement architecture should exist early.

Potential pricing dimensions:

- Organisation base fee
- Number of active cards
- Number of brands
- Custom domains
- Advanced analytics
- CRM integrations
- Wallet passes
- NFC cards
- White-label level

Do not tightly couple permission logic to hard-coded plan names.

Use feature entitlements.

---

# 40. Suggested Commercial Tiers

Not required in V1 UI, but useful for architecture.

## Standard

- Branded cards
- QR
- vCard
- Basic analytics
- Platform domain

## Professional

- White-label
- Lead capture
- Bulk import
- Team analytics
- Custom subdomain

## Enterprise

- Custom domain
- Multiple brands
- CRM integration
- Advanced roles
- SSO
- Advanced analytics
- Event mode
- SLA/support

---

# 41. Audit Logging

Audit all sensitive administrative actions.

Examples:

- User invited
- User removed
- Role changed
- Card published/unpublished
- Employee archived
- Brand edited
- Lead exported
- Domain added
- Integration credentials updated
- Organisation disabled

Audit logs should be append-only from normal dashboard users.

---

# 42. Data Retention and Deletion

Define policies for:

- Archived employees
- Deleted employees
- Leads
- Analytics
- Audit logs
- Uploaded assets
- Expired invitations

Soft delete may be useful for administrative recovery.

Permanent deletion must be available for privacy/legal requirements.

---

# 43. Backups and Recovery

Production launch requires:

- Automatic database backups
- Tested restore procedure
- Migration history
- Asset backup strategy
- Recovery documentation

A backup is not considered valid until restore has been tested.

---

# 44. Error Monitoring and Observability

Track:

- Frontend errors
- Server/API errors
- Database failures
- Webhook failures
- Domain resolution failures
- Upload failures

Never expose stack traces to public users.

Include correlation/request IDs for debugging where useful.

---

# 45. Rate Limiting / Abuse Protection

Protect:

- Login
- Password reset
- Lead forms
- Public APIs
- vCard generation endpoints if dynamic
- QR generation endpoints
- Invitation endpoints
- File uploads

Lead forms need spam protection.

Prefer low-friction protection before using intrusive CAPTCHAs.

---

# 46. Security Checklist

Before production:

- RLS verified
- Server-side permission checks
- Secrets excluded from source control
- Input validation
- Output escaping
- Secure file upload validation
- Rate limiting
- CSRF considerations
- Content Security Policy
- HTTPS only
- Secure cookies
- No sensitive data in client logs
- No secret credentials in analytics
- Dependency audit
- Database backup
- Error handling
- Audit logs
- Integration secret encryption

---

# 47. Public API Strategy

Do not expose unnecessary internal APIs.

Future API can support:

- Cards
- Employees
- Leads
- Analytics
- Webhooks

Use:

- scoped API keys
- organisation boundaries
- rate limits
- audit logs

API versioning should be planned before external customers depend on it.

---

# 48. PWA Consideration

A PWA may be useful later for card owners who want fast access to their own QR/share screen.

Possible features:

- Add card-management shortcut to home screen
- Cached personal QR
- Fast share mode

Do not make PWA installation required for recipients.

---

# 49. Apple Wallet / Google Wallet

Future feature.

Potential pass contents:

- Employee name
- Job title
- Company
- Logo
- QR code
- Card URL

Wallet implementation requires platform-specific signing and pass-management infrastructure.

Keep this outside MVP.

---

# 50. Email Signatures

Future adjacent product.

Company admin could generate centrally branded signatures linking to employee cards.

Potential analytics source:

```text
src=email-signature
```

This makes email signatures a natural distribution mechanism.

---

# 51. Employee Invitation Flow

Two approaches:

## Managed Profile

Admin manages all employee content.

No employee account required.

Best for tightly controlled corporate clients.

## Employee Login

Admin creates profile and sends invite.

Employee completes permitted fields.

The platform should support both models.

---

# 52. Approval Workflow

Optional organisation setting:

```text
Employee changes require approval
```

Flow:

```text
Employee edits profile
→ draft changes
→ admin notified
→ admin approves
→ public card updates
```

Can be deferred until later but schema should not prevent it.

---

# 53. Card Status Lifecycle

Possible states:

- draft
- active
- paused
- archived

Behaviour:

### Draft
Only visible in preview.

### Active
Publicly accessible.

### Paused
Public URL shows configurable unavailable state.

### Archived
Removed from normal admin views but retained for records.

---

# 54. Employee Offboarding

Important corporate use case.

Admin should be able to:

1. Disable card immediately
2. Reassign leads if needed
3. Archive employee
4. Reassign NFC tag
5. Redirect old card URL optionally
6. Remove employee login
7. Preserve audit history

---

# 55. URL Strategy

Use stable, readable URLs.

Example:

```text
/company/shandon-hall
```

For custom domains:

```text
/shandon-hall
```

Avoid exposing database IDs.

Slug changes should support optional redirects to prevent printed QR codes becoming invalid.

---

# 56. Card Preview

Admin editor should include:

- Live mobile preview
- Desktop preview
- QR preview
- Dark/light background preview if relevant

Preview must use the same card renderer as production wherever possible.

Avoid separate mock-only components that drift from the public card.

---

# 57. Brand Editor

Controls:

- Logos
- Colours
- Font pair
- Background
- Button style
- Card radius
- Layout selection
- Link styling
- Footer
- Default CTA

Provide:

- Live preview
- Contrast warnings
- Reset to inherited value
- Draft/save/publish behaviour

---

# 58. Template Architecture

Templates should define composition, not duplicate business logic.

Example:

```ts
type CardLayout = {
  id: string
  name: string
  supportedSections: CardSectionType[]
  defaultSectionOrder: CardSectionType[]
}
```

Shared functionality such as WhatsApp, vCard and analytics should not be reimplemented per layout.

---

# 59. Card Components

Reusable components:

- BrandLogo
- ProfileImage
- IdentityBlock
- SaveContactButton
- ContactActionRow
- PrimaryCTA
- AboutSection
- LinkList
- SocialLinks
- DocumentList
- BookingCTA
- ShareButton
- QRButton
- ExchangeDetailsButton
- Footer

---

# 60. Admin UX Principle

Optimise for speed.

Common actions should not require navigating through many screens.

Examples:

- Add employee
- Duplicate card
- Copy public URL
- Download QR
- Pause card
- Preview card
- Edit employee
- View analytics

---

# 61. Search and Filtering

Dashboard should support:

- Search employee
- Filter by brand
- Filter by location
- Filter by card status
- Filter by incomplete profiles

For large clients, pagination or virtualised tables will be required.

---

# 62. Organisation Dashboard

Suggested overview:

```text
Active Cards
Total Views
vCard Downloads
Leads Captured

Recent Activity

Top Cards

Top Sources

Profile Completion

Quick Actions
+ Add Employee
+ Import CSV
+ Create QR Campaign
```

---

# 63. Analytics Dashboard

Filters:

- Date
- Brand
- Location
- Employee
- Source
- Event

Charts:

- Views over time
- Actions over time
- Top cards
- Top CTAs
- Lead submissions
- Source breakdown

Avoid overloading V1 with excessive charts.

---

# 64. Privacy-Friendly Analytics

Prefer first-party analytics.

Do not require invasive tracking for core reporting.

Consider:

- anonymised sessions
- no third-party ad tracking
- minimal IP retention
- clear cookie/analytics strategy

If cookies or identifiers are used beyond strictly necessary functionality, implement appropriate consent mechanisms.

---

# 65. Internationalisation

Initial market:

- South Africa
- English

Architecture should allow:

- Afrikaans
- Other languages
- Locale-specific date formatting
- Country codes
- Multiple timezones

Do not hard-code `+27` into data structures.

---

# 66. Phone / WhatsApp Normalisation

Store phone numbers in a normalised international format where possible.

Display may be localised.

WhatsApp URLs should be generated safely.

Do not treat every phone number as WhatsApp-enabled unless explicitly configured.

---

# 67. Booking Links

Allow:

- Calendly
- Microsoft Bookings
- Google Calendar booking pages
- GoHighLevel calendars
- Custom URL

Track booking-link click only.

Do not claim a booking was completed without integration confirmation.

---

# 68. Social Links

Supported types can include:

- LinkedIn
- Facebook
- Instagram
- X
- YouTube
- TikTok
- Website
- Portfolio
- GitHub

Allow generic custom links.

---

# 69. Primary CTA System

Examples:

- Book a Meeting
- Request a Quote
- Book a Test Drive
- View Portfolio
- Download Company Profile
- Contact Me
- View Current Offers

CTA can be inherited from:

- organisation
- brand
- location
- employee/card

---

# 70. Automotive Extension

The architecture should support future automotive cards.

Potential data:

- Dealership
- Sales executive
- Test-drive link
- Current offers
- Vehicle links
- Dealership phone
- Salesperson WhatsApp

Avoid putting vehicle-inventory logic into the generic card core.

Use optional modules.

---

# 71. Engineering / B2B Extension

Potential card modules:

- Capability statement
- Projects
- Service areas
- Certifications
- Company profile
- Case studies
- Appointment request

---

# 72. Analytics Accuracy Language

Dashboard labels should distinguish:

- Views
- Clicks
- Downloads requested
- Form submissions
- Confirmed CRM outcomes

Never convert a click into a claimed business outcome.

---

# 73. Testing Strategy

## Unit Tests

Test:

- permission logic
- brand inheritance
- URL generation
- vCard generation
- analytics event validation
- phone formatting
- tracking-source parsing

## Integration Tests

Test:

- organisation creation
- employee creation
- card publishing
- lead capture
- tenant isolation
- imports
- domain resolution

## End-to-End Tests

Critical flows:

1. Admin creates organisation
2. Admin configures brand
3. Admin adds employee
4. Card is published
5. Public user views card
6. Public user downloads vCard
7. Public user submits exchange form
8. Admin sees lead
9. Admin views analytics

## Device Testing

At minimum:

- iPhone Safari
- Android Chrome
- Desktop Chrome
- Desktop Edge
- Desktop Safari where available

---

# 74. Seed Data

Create realistic development seed data.

Suggested organisations:

## DeVision Media

Users:

- Shandon Hall
- Sample colleague

## Demo Automotive Group

Brands:

- Demo Brand A
- Demo Brand B

Locations:

- Sandton
- Roodepoort

Do not use real client data in public demo environments without permission.

---

# 75. Demo Mode

Consider a sandbox/demo tenant that can be reset.

Useful for:

- Sales demonstrations
- Internal testing
- Client previews

Demo data should never mix with production client analytics.

---

# 76. Non-Goals for Initial MVP

Do not build immediately:

- Full CRM
- Full marketing automation suite
- Native mobile apps
- Proprietary NFC hardware
- Apple Wallet
- Google Wallet
- Billing automation
- Enterprise SSO
- Complex workflow builder
- Full email-signature manager
- AI brand scraping
- Advanced event management
- Multi-language content editor
- Public external API

Plan for them, but keep V1 focused.

---

# 77. MVP Scope

The MVP should include:

## Platform

- Authentication
- Multi-tenant organisations
- Organisation roles
- Basic audit logs

## Organisation Management

- Create organisation
- Configure settings
- Brand kit
- Logo upload
- Colours
- Typography
- Layout selection

## Structure

- Brands
- Locations
- Employees

## Cards

- Create/edit card
- Publish/unpublish
- 3 layouts
- Profile photo
- Contact details
- About
- Social links
- Custom links
- Primary CTA
- QR
- Share
- vCard

## Lead Capture

- Exchange-details form
- Lead list
- Consent field
- CSV lead export

## Analytics

- Views
- CTA clicks
- Link clicks
- vCard downloads
- Lead submissions
- Date filtering
- Employee filtering
- Source tracking

## Operations

- CSV employee import
- Basic CSV export
- Image uploads
- Staging/production
- Error handling
- RLS
- Backups

---

# 78. V1.1

After MVP stability:

- Custom domains
- Advanced QR campaign management
- Bulk card actions
- Employee self-service login
- Approval workflow
- More analytics
- Generic webhooks
- Better import mapping
- Organisation email branding

---

# 79. V2

- NFC management
- GoHighLevel integration
- HubSpot integration
- Event mode
- Wallet passes
- Multiple card modes
- Team dashboards
- Custom domain automation
- More layouts
- Role hierarchy
- White-label transactional email
- Subscription billing

---

# 80. V3

- Email signatures
- API
- SSO
- AI-assisted brand setup
- AI-assisted profile writing
- Advanced attribution
- Sales enablement modules
- Content recommendations
- Employee directories
- Advanced identity platform features

---

# 81. MVP Development Sequence

## Milestone 0: Foundation

- Initialise project
- Configure TypeScript
- Configure Tailwind
- Configure component library
- Configure linting/formatting
- Configure environment variables
- Configure Supabase client
- Create staging setup
- Create initial documentation

Acceptance:

- App runs locally
- Build succeeds
- Staging deploy succeeds
- No secrets committed

## Milestone 1: Authentication + Tenancy

- Auth
- Users
- Organisations
- Memberships
- Roles
- RLS
- Protected dashboard

Acceptance:

- Admin can sign in
- User can only access their organisation
- Cross-tenant access tests fail correctly

## Milestone 2: Organisation + Brand Kit

- Organisation editor
- Logo uploads
- Colour controls
- Font controls
- Theme tokens
- Live preview

Acceptance:

- Change primary colour once
- All inherited card previews update

## Milestone 3: Structure

- Brands
- Locations
- Employees
- Search/filter

Acceptance:

- Organisation can contain multiple brands and locations
- Employees are assigned correctly

## Milestone 4: Public Card Renderer

- Shared card data model
- Executive layout
- Corporate layout
- Modern layout
- Mobile-first rendering

Acceptance:

- Public card renders without login
- Correct branding resolves
- No cross-tenant leakage

## Milestone 5: Actions

- Call
- WhatsApp
- Email
- Website
- Social links
- Primary CTA
- vCard
- Native share/fallback
- QR share mode

Acceptance:

- Core actions work on mobile
- vCard imports successfully on test devices

## Milestone 6: Publishing

- Draft/active/paused/archive
- Slugs
- Redirect strategy
- Preview
- Publish

Acceptance:

- Draft is not public
- Active is public
- Paused displays correct state

## Milestone 7: Lead Capture

- Exchange-details modal/form
- Lead storage
- consent
- Lead admin list
- CSV export

Acceptance:

- Lead captured from public card
- Appears under correct organisation and employee
- Other tenants cannot access it

## Milestone 8: Analytics

- Event model
- View tracking
- action tracking
- source tracking
- dashboard

Acceptance:

- Events appear against correct card
- Filters work
- No duplicated view inflation from obvious refresh behaviour where avoidable

## Milestone 9: CSV Import

- Upload
- Mapping
- Validation
- Preview
- Error report
- Import

Acceptance:

- 100+ employee rows can be processed reliably
- Bad rows are clearly identified

## Milestone 10: Hardening

- Security review
- Accessibility
- Performance
- Error monitoring
- Backup verification
- Mobile QA
- Documentation

Acceptance:

- Production readiness checklist completed

---

# 82. Suggested Initial Pages

Public:

```text
/[organisationSlug]/[cardSlug]
/[organisationSlug]/[cardSlug]/qr
/privacy
```

Authenticated:

```text
/dashboard
/dashboard/team
/dashboard/team/new
/dashboard/team/[employeeId]
/dashboard/cards
/dashboard/cards/[cardId]
/dashboard/brand
/dashboard/locations
/dashboard/leads
/dashboard/analytics
/dashboard/import
/dashboard/settings
```

Platform:

```text
/admin
/admin/organisations
/admin/organisations/[id]
/admin/templates
/admin/domains
/admin/audit
```

---

# 83. API / Server Actions

Prefer server actions or route handlers where appropriate.

Core operations:

- createOrganisation
- updateOrganisation
- createBrand
- updateBrandKit
- createLocation
- createEmployee
- updateEmployee
- createCard
- publishCard
- pauseCard
- createLead
- trackEvent
- generateVCard
- createTrackingSource
- importEmployees
- exportEmployees
- exportLeads

Every write must validate:

1. input
2. authenticated user
3. tenant permission
4. entity ownership

---

# 84. Validation

Use a single validation strategy across:

- client forms
- server actions
- API routes
- CSV imports

Never trust client-side validation alone.

Common validations:

- URL format
- email
- phone
- slug
- file type
- file size
- hex colours
- role
- organisation ownership

---

# 85. Form UX

Forms should:

- autosave where safe or clearly save drafts
- show field errors inline
- preserve entered content on error
- warn before leaving unsaved changes
- show inherited vs overridden values
- provide mobile preview

---

# 86. Slug Rules

Slug requirements:

- lowercase
- URL safe
- human readable
- unique in relevant scope
- reserved word protection

Reserved examples:

- admin
- dashboard
- api
- auth
- privacy
- terms

---

# 87. Data Isolation Tests

Create automated tests that attempt:

- User A reading User B's employee
- User A updating User B's card
- User A accessing User B's leads
- User A downloading User B's private asset
- User A querying User B's analytics

All must fail.

This is a launch-blocking requirement.

---

# 88. Feature Flags

Use feature flags / entitlements.

Example:

```text
lead_capture = true
custom_domain = false
event_mode = false
crm_sync = false
```

This allows safe incremental rollout.

---

# 89. Support / Troubleshooting

Platform admin should be able to see:

- organisation status
- active cards
- last update
- domain status
- integration health
- recent errors where appropriate
- audit activity

Do not expose secrets.

---

# 90. Client Offboarding

Process should support:

- export data
- disable public cards
- disable domains
- archive organisation
- remove integrations
- revoke user sessions
- apply retention policy
- permanently delete after required retention period

---

# 91. Product Analytics for DeVision

Separate platform-level product analytics from client card analytics.

DeVision may need:

- active organisations
- active cards
- cards created
- card views
- leads generated
- feature usage
- organisation growth

Client users must not see other clients' product data.

---

# 92. Potential Pricing Metrics to Record

Even before billing exists, keep counts available for:

- active cards
- total employees
- active brands
- active locations
- custom domains
- monthly public views
- leads captured

Useful later for commercial plans.

---

# 93. Naming and Branding Architecture

Do not hard-code the eventual product name throughout the codebase.

Use environment/config:

```text
PLATFORM_NAME
PLATFORM_LOGO
PLATFORM_SUPPORT_EMAIL
PLATFORM_BASE_DOMAIN
```

This keeps DeVision's own product branding flexible.

---

# 94. White-Label Levels

Possible settings:

## Co-Branded

Client branding with:

```text
Powered by DeVision
```

## White Label

No public DeVision branding.

## Full White Label

- Custom public domain
- Custom login branding
- Custom emails
- Custom support details
- No platform branding

Architecture should allow this even if V1 launches with fewer levels.

---

# 95. Content Security

Public card bios and link labels are user-controlled content.

Prevent:

- XSS
- unsafe HTML
- javascript URLs
- malicious embedded content

V1 should favour structured fields over arbitrary HTML.

---

# 96. Link Safety

Validate links.

Allow only approved protocols:

- https
- http where necessary
- tel
- mailto

Generate WhatsApp links internally.

Do not allow `javascript:` or other dangerous schemes.

---

# 97. Image Handling

On upload:

- validate MIME
- resize large images
- create optimised variants
- strip unnecessary metadata where appropriate
- preserve reasonable quality
- store alt text

Profile photos should support crop positioning.

---

# 98. Open Graph / Social Preview

Each card should generate a branded preview when shared.

Include:

- Person name
- Job title
- Organisation
- Logo or profile image

Future option:

- dynamically generated OG image

---

# 99. Redirect Handling

Printed QR codes and NFC tags must remain reliable.

If slug changes:

- store old slug
- 301/302 redirect as appropriate
- preserve tracking source

Do not break existing physical materials.

---

# 100. Success Metrics for MVP

The MVP is successful when:

1. A new organisation can be created without code changes.
2. A brand can be configured in the admin dashboard.
3. New employees can be added manually or by CSV.
4. Each employee receives a working branded card.
5. The card works well on iPhone and Android.
6. Contact saving works.
7. QR sharing works.
8. Native share/fallback works.
9. Contact exchange captures a lead.
10. Leads are isolated per tenant.
11. Basic analytics are visible.
12. Brand changes propagate through inherited cards.
13. The product can be demonstrated to a prospective client confidently.
14. DeVision can onboard the second client without a developer modifying card code.

---

# 101. Initial Demo Client

Use DeVision Media as the first live test tenant.

Important:

Do not hard-code DeVision data.

Create it through the same organisation onboarding flow intended for clients.

Test:

- Organisation setup
- Brand kit
- Staff import
- Card publishing
- QR generation
- Analytics
- Leads

This validates the real onboarding workflow.

---

# 102. Definition of Done for V1

V1 is complete only when:

- Core feature acceptance criteria pass
- Tenant isolation has been tested
- No critical security issues remain
- Mobile card experience is polished
- Admin onboarding is usable
- DeVision tenant is live
- A second demo/client tenant can be onboarded without code
- Backups are enabled
- Privacy policy placeholders/routes exist
- Error monitoring is configured
- Production deployment is documented
- Database migrations are committed
- Seed/demo data is separated from production
- Basic product documentation exists

---

# 103. Development Rules for Cursor

Cursor should follow these rules throughout the project:

1. Do not build all features in one pass.
2. Implement milestone-by-milestone.
3. Keep the app running after each milestone.
4. Never bypass tenant security for convenience.
5. Never hard-code organisation IDs.
6. Never hard-code client branding into components.
7. Reuse components.
8. Keep public card rendering separate from dashboard editing logic.
9. Use schema migrations.
10. Add tests for critical permission logic.
11. Validate all server inputs.
12. Never expose service-role credentials to the browser.
13. Do not add a dependency unless it solves a real problem.
14. Keep public pages fast.
15. Use accessible components.
16. Document architectural decisions.
17. Prefer clear code over clever code.
18. Ask before making destructive database changes.
19. Preserve backwards compatibility for published card URLs.
20. Never silently change the project scope.

---

# 104. First Development Sprint

The first sprint should focus only on foundation.

Deliver:

- Next.js project
- TypeScript
- Tailwind
- UI component baseline
- Supabase setup
- Auth
- organisations table
- memberships table
- basic RLS
- protected dashboard
- platform admin concept
- seed/demo organisation
- environment configuration
- initial migration structure
- README
- architecture notes

Do not start card animations, NFC, Wallet, CRM or billing in the first sprint.

---

# 105. Second Development Sprint

Deliver:

- brands
- brand kits
- locations
- employees
- asset uploads
- theme resolution
- brand editor
- mobile preview

Primary test:

> Change a client's primary colour and logo once and confirm all inherited previews update.

---

# 106. Third Development Sprint

Deliver:

- cards
- card sections
- public route
- 3 layouts
- vCard
- contact links
- QR
- share
- publish status

Primary test:

> An employee card can be created, published, opened on a phone, saved as a contact and shared.

---

# 107. Fourth Development Sprint

Deliver:

- lead exchange
- analytics events
- source tracking
- leads dashboard
- analytics dashboard
- CSV export

Primary test:

> A real-world scan can create a measurable interaction and optional lead assigned to the correct card owner.

---

# 108. Fifth Development Sprint

Deliver:

- CSV employee import
- role polish
- audit logs
- performance
- accessibility
- security hardening
- staging QA
- production readiness

---

# 109. Key Architectural Decisions That Must Not Be Revisited Casually

These are intentional:

- Multi-tenant from day one
- Brand inheritance
- Cards are data, not custom pages
- Dynamic QR URLs
- Public pages require no login
- Employee fields may be admin-locked
- Leads are tenant-private
- Analytics are first-party where practical
- Custom domains are mapped to tenants
- Printed QR/NFC links must remain durable
- White-label configuration is centralised

Any change to these principles should be documented.

---

# 110. Final Product Direction

The MVP is a digital business-card product.

The architecture should allow it to grow into:

> A white-label digital identity, lead capture and employee networking platform for organisations.

The immediate objective is not to build every future feature.

The immediate objective is to build the foundation correctly enough that DeVision can:

1. onboard itself,
2. onboard a first paying client,
3. onboard larger teams,
4. apply custom branding without development,
5. capture leads,
6. prove engagement,
7. add integrations and premium features without rebuilding the application.

