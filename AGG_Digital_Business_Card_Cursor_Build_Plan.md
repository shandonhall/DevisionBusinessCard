# AGG Digital Business Card Platform
## Cursor Build Plan
### Working product direction: AGG-first, reusable later

---

## 1. Product Goal

Build a premium digital business card system for AGG that demonstrates what DeVision Media can achieve visually and technically before adding broader integrations.

The first commercial objective is not to build a full CRM, chatbot, NFC management platform, or dealership operating system.

The first commercial objective is:

> Create a digital business card that looks and feels significantly more premium than standard digital card products, is easy to use on a phone, is unmistakably branded for AGG, and is simple for DeVision to roll out across AGG dealerships and staff.

The system should be built for AGG first, while keeping the underlying architecture reusable for future DeVision clients.

Core principle:

> Build AGG first. Do not build AGG-only.

---

# 2. Current Commercial Scope

## Build now

The first sellable version should include:

- AGG-branded digital business card experience
- Individual staff cards
- Shareable public URLs
- Employee name
- Job title
- Employee photograph
- AGG identity
- Dealership/location
- Relevant vehicle brand or brands
- Mobile phone number
- Email address
- WhatsApp action
- Website/dealership link
- Save Contact / vCard
- Native Share
- Copy Link
- QR Code
- Front/reverse card experience if it improves the design
- Premium interaction and motion
- Mobile-first layout
- DeVision admin management
- Organisation / dealership / employee structure
- Central brand configuration
- Hosting-ready deployment
- Graceful reduced-motion/static fallback
- Basic privacy/compliance foundation
- Clean scalable data model

## Architect for later, but do not build now

Do not allow these items to expand the initial scope:

- chatbot integration
- CRM integration
- DealerOS integration
- automated lead routing
- callback scheduling
- salesperson performance ranking
- NFC tag management
- Apple Wallet / Google Wallet
- Meta API integration
- advanced analytics
- automated sales dashboards
- vehicle inventory feeds
- automated website scraping at production scale
- AI brand extraction
- billing automation
- external client self-service portal
- complex permissions
- lead exchange forms unless already present and simple to retain

Interfaces and data models may leave clean extension points for these items, but no current feature should depend on them.

---

# 3. Business Context

AGG is the launch customer/use case.

The system should be capable of modelling:

Platform
→ Organisation
→ Location / Dealership
→ Employee
→ Card

Vehicle brands should be modelled separately from the organisation because an AGG location or employee may represent one or multiple marques.

Conceptual example:

AGG
├── Northcliff
│   ├── JAC
│   ├── Jetour
│   └── Geely
│
├── Roodepoort / Ontdekkers
│   ├── JAC
│   ├── Jetour
│   └── Geely
│
├── Sandton
│   └── JAC
│
└── Other locations

Do not assume this example is the final dealership hierarchy. The current AGG website or approved client list remains the source of truth.

---

# 4. Core Product Positioning

The card should not feel like:

- a Linktree
- a profile page
- a CRM contact record
- a generic SaaS dashboard
- a basic mobile web page
- a template with AGG colours dropped on top

It should feel like:

> A premium automotive identity object that happens to contain highly practical contact functionality.

The desired reaction is:

> “That is a seriously good digital business card.”

The card should look impressive in a static screenshot and become even better when interacted with.

---

# 5. AGG Creative Direction

Working experience name:

# AGG DRIVE

This is a design preset / experience configuration, not a separate hard-coded application.

## Visual concept

Premium automotive studio + precision credential.

Think of:

- a new vehicle photographed in a dark studio
- controlled reflections
- graphite and lacquered materials
- polished edges
- precision surface treatment
- restrained glass
- badge-like branding
- premium dealership presentation
- deliberate typography
- subtle dimensional motion

Avoid:

- cyberpunk
- gaming UI
- excessive neon
- giant gradients
- floating particles
- gimmicky 3D
- carbon fibre clichés unless the actual brand direction supports it
- cheap glassmorphism
- generic rounded SaaS cards
- fake luxury gold
- excessive glowing borders

---

# 6. Brand Hierarchy

The card should have a deliberate identity hierarchy.

Primary:
- AGG

Secondary:
- dealership/location

Tertiary:
- represented vehicle marque(s)

Employee identity remains central, but the card should clearly belong to AGG.

Example:

AGG
Camryn Joseph
Marketing
AGG Northcliff
Representing: JAC · Jetour · Geely

Do not let a vehicle marque completely replace the AGG master identity unless AGG explicitly requests that later.

---

# 7. Brand Data Strategy

The AGG website and approved brand assets should inform:

- logo
- colour palette
- typography
- button character
- spacing
- imagery
- visual tone
- relevant dealership naming
- brand relationships

Do not blindly scrape and hotlink external assets.

For the initial implementation:

1. inspect AGG website and local project assets
2. identify likely AGG logos/brand assets
3. copy only approved/local assets into the application asset system
4. resolve styling through Brand DNA/configuration
5. make it editable centrally

Do not guess exact brand colours if reliable assets are not available.

---

# 8. Brand DNA

Preserve or extend the existing brand/theme system.

Suggested conceptual structure:

```ts
type BrandDNA = {
  identity: {
    logoUrl?: string
    logoMarkUrl?: string
    primaryColour: string
    secondaryColour: string
    accentColour: string
    backgroundColour: string
    surfaceColour: string
    textColour: string
    mutedTextColour: string
    headingFont?: string
    bodyFont?: string
  }

  visual: {
    personality: "automotive-premium" | string
    material: "graphite-lacquer" | string
    surfaceStyle: string
    edgeTreatment: string
    logoTreatment: string
    portraitTreatment: string
    geometryStyle: string
    lightingStyle: string
  }

  motion: {
    style: "controlled" | "fluid" | "minimal"
    tiltStrength: number
    parallaxStrength: number
    reflectionStrength: number
    ambientMotion: number
    revealStyle: string
  }

  accessibility: {
    reducedMotionMode: "static-premium"
  }
}
```

The exact structure should fit the existing repository rather than forcing this exact interface.

---

# 9. Experience Engine

The public card renderer should be driven by data.

Conceptually:

```tsx
<CardExperience
  organisation={organisation}
  location={location}
  employee={employee}
  vehicleBrands={vehicleBrands}
  brandDNA={resolvedBrandDNA}
  experience={resolvedExperience}
/>
```

No shared component should contain logic such as:

```ts
if (organisation.name === "AGG") {
  // render special AGG UI
}
```

Instead:

```ts
experiencePreset = "drive"
```

and AGG receives the Drive configuration through normal tenant data.

---

# 10. AGG Drive Experience

## Main physical object

Use a landscape physical-card proportion where practical.

Target impression:

- slim precision-manufactured credential
- graphite / dark lacquer material
- restrained translucent or smoked layers
- very fine metallic texture if appropriate
- controlled highlights
- premium edge
- vehicle-studio lighting

The design must not depend on animation to look good.

Static screenshot test:

> If pointer effects are disabled and a screenshot is taken, the card must still look premium.

---

# 11. Card Front

Front should prioritise identity.

Possible content:

- AGG logo / mark
- employee photograph
- employee name
- role
- AGG / dealership name
- selected brand context

Keep it visually restrained.

Do not place the entire contact interface on the front.

Do not use giant generic avatar circles.

Use negative space confidently.

---

# 12. Portrait Treatment

A salesperson's portrait is likely to be one of the most important visual elements.

Recommended treatment:

- professional rectangular/cropped portrait
- integrated into material, not inserted into a UI tile
- controlled mask/fade into card
- subtle dark automotive grade
- maintain natural skin tone
- optional faint brand-colour edge lighting
- surface/reflection layer above image
- slight independent parallax

Fallback:
- premium monogram treatment if no image exists

Do not use a generic app-profile avatar as the flagship treatment.

---

# 13. Logo Treatment

The AGG logo should feel physically integrated.

Potential treatment:

- badge-like embedded mark
- lacquer/metallic inset
- subtle physical depth
- fine edge reflection
- restrained surface highlight

Never distort, redraw, recolour or incorrectly crop the supplied logo.

Use transparent source artwork wherever possible.

---

# 14. Surface and Material

Working material:

# Graphite Lacquer

Possible layers:

1. rear/depth surface
2. main body
3. fine material texture
4. portrait
5. identity
6. logo/badge layer
7. reflection layer
8. edge treatment
9. front clearcoat/glass layer

The effect should be closer to automotive paint/trim than generic glassmorphism.

---

# 15. Lighting

Use automotive studio lighting as the visual language.

Potential light behaviour:

- broad softbox reflection
- narrower highlight
- subtle side edge light
- slight accent reflection derived from AGG palette
- restrained background bounce light

Pointer movement may change reflection position independently of card tilt.

Do not use a white cursor-following gradient that obviously looks like a CSS trick.

---

# 16. Card Depth

Use multiple layers or pseudo-elements.

Do not achieve the entire effect by rotating one flat div.

Different layers can respond at different strengths:

- body
- portrait
- logo
- type
- reflection
- background

Maximum tilt should remain restrained, roughly around 4 to 7 degrees unless visual testing suggests less.

The purpose is physical presence, not demonstrating 3D technology.

---

# 17. Flip / Reverse

Use a reverse side only if it improves the experience.

Potential back-side content:

- AGG mark
- QR code
- primary contact details
- dealership
- represented brands

Critical actions must remain directly available outside the flip interaction.

A visitor must never need to discover the flip to call, WhatsApp or save the contact.

If flip is implemented:
- use real perspective
- preserve physical thickness
- correct backface visibility
- maintain lighting continuity
- respect reduced motion
- keep duration controlled

---

# 18. Primary Actions

Priority:

1. Save Contact
2. Call / WhatsApp
3. Email / Website
4. Share / Copy / QR

Save Contact should be the primary practical CTA.

It should not look like a giant generic coloured web button.

Use the same material language as the card.

---

# 19. Action Dock

Create a compact premium automotive control dock.

Primary row:

- Call
- WhatsApp
- Email
- Website

Secondary row:

- Share
- Copy
- QR

Interaction:

- subtle hover lift/light
- tactile press
- tiny scale/translate response
- excellent icon alignment
- clear labels

Avoid giant outlined boxes.

Avoid excessive rounding.

Avoid button designs that visually compete with the hero card.

---

# 20. Mobile First

The actual use case is QR/link sharing on phones.

Test at:

- 320 px
- 375 px
- 390 px
- 430 px

Mobile requirements:

- no horizontal overflow
- card remains large enough to feel premium
- portrait crop remains intentional
- actions are thumb-friendly
- no hover-only information
- animations do not interfere with scrolling
- card must work in portrait orientation
- no device-orientation permission required
- account for mobile browser safe areas

Desktop adds stronger pointer interaction and more environmental space.

---

# 21. Motion

Motion character:

- restrained
- precise
- premium
- automotive
- physically motivated

Entrance should take roughly one second or less before everything is usable.

Possible sequence:

- environment resolves
- card settles into frame
- identity appears
- one restrained reflection passes
- actions finish appearing

Avoid:
- letter-by-letter text
- spinning card
- floating particles
- endless sheen loops
- constant obvious bobbing

Ambient movement should be nearly subconscious.

---

# 22. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduced mode:

- no continuous parallax
- no pointer tilt
- no dramatic flip
- minimal opacity transitions
- all content remains available
- material styling remains premium

---

# 23. DOM vs WebGL

Do not automatically rebuild the card in WebGL.

Prefer semantic DOM/CSS for:

- names
- roles
- links
- buttons
- Save Contact
- contact actions
- QR UI
- accessibility

Use WebGL only if it materially improves decorative atmosphere or lighting and does not compromise loading.

Layered DOM + CSS perspective may be the best option for the card itself.

If Three.js/React Three Fiber is already installed, evaluate rather than assuming it must be used.

---

# 24. Performance

This product will frequently be opened from QR links on mobile data.

Requirements:

- identity content renders immediately
- heavy enhancements cannot block contact information
- image optimisation
- no huge textures
- no large background video
- restrained filters/blurs
- pointer updates through requestAnimationFrame/CSS variables where appropriate
- avoid React rerender on every pointer move
- dynamically load heavy decorative effects
- card remains fully usable without WebGL
- pause ambient animation when page is not visible if appropriate

---

# 25. Accessibility

Maintain:

- semantic buttons/anchors
- keyboard interaction
- readable contrast
- visible focus states
- accessible QR modal
- descriptive alt text
- reduced motion
- sensible heading structure
- no text rendered only inside canvas
- no contact action hidden behind gesture-only interactions

---

# 26. Data Model

Cursor must inspect the existing schema first.

Conceptual target:

## organisations
AGG group-level record.

## locations
Individual dealership/location records.

Potential fields:
- organisation_id
- name
- slug
- address
- phone
- website_url
- active

## vehicle_brands
- JAC
- Jetour
- Geely
- MG
- Pre-owned if needed as a category rather than manufacturer

## location_vehicle_brands
Many-to-many mapping.

## employees
- organisation_id
- location_id
- first_name
- last_name
- display_name
- job_title
- email
- mobile
- whatsapp
- profile_image
- bio
- active

## employee_vehicle_brands
Optional many-to-many mapping where an employee represents a subset of the location's brands.

## cards
- employee_id
- slug
- status
- experience_preset
- published_at

## brand_dna / brand_kits
Central organisation-level design system.

## assets
Approved logo/profile/brand assets.

Do not rebuild tables that already exist cleanly.

Prefer migrations that extend the current model.

---

# 27. URL Strategy

Initial public URL should be simple and durable.

Examples:

```txt
cards.devisionmedia.co.za/camryn-joseph
```

or

```txt
connect.devisionmedia.co.za/agg/camryn-joseph
```

Use the existing project/domain structure rather than forcing these examples.

Important:
- slugs should remain stable
- changing employee details should not change the URL
- redirect support should exist if slugs are later changed
- never expose database IDs publicly unless intentionally designed

Future custom domains may be supported later.

---

# 28. DeVision Admin Experience

For the first release, DeVision manages the system.

Do not build a large client self-service platform yet.

Admin should be able to:

- create/edit AGG organisation
- manage Brand DNA
- create/edit dealerships
- assign brands to dealerships
- create/edit employees
- assign employees to dealership
- assign relevant brands
- upload profile image
- edit contact information
- preview card
- publish/unpublish
- copy public link
- open QR
- archive employee

Bulk CSV import can be added if simple, but should not delay the demo.

---

# 29. Preview

The admin preview must use the EXACT SAME renderer as the public card.

Do not create:

- PreviewCard
- PublicCard

with separate visual logic.

Use one renderer with different surrounding shell/context.

---

# 30. Employee Offboarding

Even in V1, think about staff turnover.

Need:

- active/inactive status
- unpublish/archive
- retain historical record
- public card returns graceful inactive response
- do not permanently delete by default

Later the URL may redirect to dealership contact.

That redirect does not need to be built now unless trivial.

---

# 31. Core Analytics

If analytics already exists, preserve it.

At minimum it is useful to be able to track:

- card view
- Save Contact
- Call
- WhatsApp
- Email
- Website
- Share
- Copy
- QR open

However:

Do not delay the initial visual demo to build a sophisticated analytics product.

If analytics is absent, architecture may leave an event hook but visual product quality has priority for this phase.

---

# 32. Privacy / Consent

The current card is primarily an outbound contact identity.

No marketing-consent capture is required simply to view the card.

If user registration/admin accounts already exist, preserve normal privacy/terms handling.

Do not build a lead database or marketing opt-in system as part of this AGG card MVP unless it already exists and can remain without scope expansion.

Future lead-capture functionality must be handled separately and in a POPIA-aware manner.

---

# 33. QR

QR is part of the current product.

Requirements:

- stable card URL
- clear, high-resolution QR
- downloadable/printable asset if existing architecture supports it
- branded surrounding design may be added later
- do not compromise QR scannability with excessive customisation

The QR modal should match the card design while keeping the code high contrast.

---

# 34. Save Contact

Save Contact must remain extremely reliable.

vCard should include appropriate available fields:

- full name
- organisation
- role
- mobile
- work phone where appropriate
- email
- website
- dealership
- note/URL if useful

Do not rewrite mature existing vCard code unless required.

Test on:
- iOS Safari
- Android Chrome
- desktop download fallback

---

# 35. WhatsApp

Use a clean wa.me/deep-link strategy already in the project.

Phone numbers should be normalised to international format in data storage or resolved presentation logic.

For South Africa, do not assume the visible local-format number can simply be concatenated into a WhatsApp URL.

Use the application's normalised phone utility.

---

# 36. Long Names / Missing Data

The card must remain premium with imperfect real-world content.

Test:

- short name
- long first/last name
- long job title
- no portrait
- no bio
- no website
- multiple brands
- one brand
- unusually long dealership name

The design should adapt rather than truncate important identity prematurely.

---

# 37. Visual Quality Tests

Cursor should not stop at “build passes”.

For every meaningful design pass:

1. run application
2. open AGG card preview
3. inspect desktop
4. inspect 390 px mobile
5. inspect static screenshot
6. inspect hover/tilt
7. inspect portrait crop
8. inspect action dock
9. inspect reverse/QR if implemented
10. refine

Questions Cursor must ask itself:

- Does this look like a premium object?
- Is AGG immediately recognisable?
- Does it feel automotive rather than generic?
- Is the card the hero?
- Are actions secondary but obvious?
- Is there any remaining dashboard UI?
- Does it still look good with no animation?
- Is anything gimmicky?
- Does the portrait feel integrated?
- Is the logo treated respectfully?
- Would this impress a client in a sales meeting?

At least one refinement pass is required if visual tooling is available.

---

# 38. Engineering Quality

Requirements:

- TypeScript
- no duplicated renderer
- clear component boundaries
- minimal unnecessary dependencies
- no client-specific branching in shared renderer
- no giant monolithic component
- proper loading/error states
- clean data resolution
- reusable configuration
- comments only where logic is genuinely non-obvious
- lint passes
- typecheck passes
- tests pass
- production build passes

---

# 39. Suggested Component Shape

This is conceptual. Adapt to current repository.

```txt
CardExperience
└── DriveExperience
    ├── DriveEnvironment
    ├── PhysicalCard
    │   ├── CardFront
    │   ├── CardBack
    │   ├── CardMaterial
    │   ├── CardLighting
    │   └── PortraitTreatment
    ├── SaveContactCTA
    ├── ContactDock
    ├── ShareControls
    └── AdditionalInfo
```

Possible hooks/utilities:

```txt
useCardTilt
useReducedMotion
useCardActions
resolveBrandDNA
resolveCardContext
normalisePhone
generateVCard
```

Do not create duplicates if equivalents already exist.

---

# 40. Phase Plan

## Phase 0: Repository Audit

Goal:
Understand what exists before modifying anything.

Cursor must identify:
- framework
- routes
- auth
- database
- card schema
- public renderer
- preview renderer
- existing theme system
- existing Dimension/DeVision experience
- contact actions
- QR
- vCard
- animation dependencies
- tests
- deployment configuration

Deliverable:
Short implementation map before edits.

---

## Phase 1: AGG Data Foundation

Goal:
Make AGG a proper tenant/configuration rather than demo hard-code.

Tasks:
- create/verify AGG organisation
- create dealership/location model or seed data
- create vehicle brand model/mapping if needed
- create sample AGG employee
- upload/use approved AGG brand assets
- create AGG Brand DNA
- set `drive` experience preset
- keep all data configurable

Deliverable:
AGG employee data resolves cleanly into the card renderer.

---

## Phase 2: Drive Experience Foundation

Goal:
Create reusable AGG Drive renderer.

Tasks:
- register `drive` experience preset
- create premium dark automotive environment
- build physical card structure
- establish material layers
- establish lighting
- build static premium composition first
- mobile responsiveness before advanced motion

Deliverable:
A static screenshot already looks impressive.

---

## Phase 3: Portrait + Identity Composition

Goal:
Perfect visual identity.

Tasks:
- portrait integration
- logo badge treatment
- name/title hierarchy
- dealership representation
- relevant vehicle brands
- long-content handling
- photo fallback

Deliverable:
The identity object looks deliberate and premium.

---

## Phase 4: Motion + Physicality

Goal:
Bring the object to life without gimmicks.

Tasks:
- pointer tilt
- smoothed transforms
- multi-layer parallax
- independent reflection
- subtle edge response
- entrance reveal
- restrained ambient lighting
- reduced-motion variant

Deliverable:
Interaction enhances an already strong static design.

---

## Phase 5: Action Dock

Goal:
Make contact functionality beautiful and obvious.

Tasks:
- Save Contact CTA
- Call
- WhatsApp
- Email
- Website
- Share
- Copy
- QR
- success feedback
- keyboard/focus states
- mobile touch interactions

Deliverable:
Actions feel like part of the premium object system rather than generic UI.

---

## Phase 6: Reverse / QR

Goal:
Add physical-card metaphor only if it improves the product.

Tasks:
- optional reverse
- QR
- dealership/brand details
- physical flip
- reduced-motion equivalent
- preserve direct actions outside card flip

Deliverable:
Useful reverse side with no usability loss.

---

## Phase 7: Admin Workflow

Goal:
DeVision can maintain AGG without editing code.

Tasks:
- locations
- vehicle brands
- employees
- images
- contact details
- preview
- publish/archive
- copy link
- QR access

Deliverable:
Adding a salesperson is a data/admin task, not a development task.

---

## Phase 8: Quality & Demo Preparation

Goal:
Make it sales-ready.

Test:
- desktop
- tablet
- 320/375/390/430 mobile
- iOS Safari
- Android Chrome
- reduced motion
- no portrait
- long names
- one/multiple brands
- contact links
- QR scanning
- vCard
- build performance

Create:
- polished AGG demo employee
- clean public demo URL
- optional desktop and mobile screenshots
- QR code for the sales meeting

Deliverable:
A client-ready demo.

---

# 41. Definition of Done

The first AGG release is complete when:

- AGG is data/configuration, not hard-coded visual branching
- dealership/location can be assigned
- vehicle brand context can be assigned
- employee can be created without code
- card is visually premium when static
- card has restrained tactile interaction
- portrait is integrated
- AGG logo feels part of the object
- Save Contact works
- Call works
- WhatsApp works
- Email works
- Website works
- Share works
- Copy works
- QR works
- preview and public route share the same renderer
- mobile experience is excellent
- reduced motion is respected
- no major accessibility issue
- lint passes
- typecheck passes
- tests pass
- production build passes
- no future integration is required for the current card to be sellable

---

# 42. Future Roadmap

After AGG approves/buys the card service, future phases can include:

- NFC card/tag provisioning
- chatbot salesperson selection
- callback booking
- lead exchange
- CRM sync
- DealerOS integration
- round-robin lead routing
- salesperson performance analytics
- vehicle-specific routing
- advanced card analytics
- Apple/Google Wallet
- dealership-level admin
- client self-service
- automated Brand DNA extraction
- additional experience presets for other DeVision clients

Keep these documented but out of the MVP.

---

# 43. Cursor Working Rules

Cursor must:

- inspect before changing
- work in phases
- preserve working functionality
- avoid unnecessary migrations
- avoid replacing mature code
- prefer reuse
- visually inspect after design changes
- stop scope creep
- never add an integration merely because it seems useful
- keep AGG configuration data-driven
- test after each meaningful milestone
- document material architectural decisions

---

# 44. First Cursor Task

Use the accompanying `AGG_Cursor_Master_Prompt.md`.

Do not ask Cursor to build the whole roadmap in one operation.

The first run should inspect the repo, map the existing implementation, and then begin Phase 1 only after it understands the current architecture.
