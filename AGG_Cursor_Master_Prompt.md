# Cursor Master Prompt: AGG Digital Business Card

Read `AGG_Digital_Business_Card_Cursor_Build_Plan.md` completely before making changes.

This repository already contains a working digital business card implementation.

Your job is NOT to restart the project.

Your job is to evolve the current system into an AGG-first premium digital business card platform while preserving reusable architecture for future clients.

## Core commercial goal

We are currently selling the QUALITY of the digital business card itself.

Do not expand scope into:
- chatbot integration
- CRM
- DealerOS
- lead routing
- NFC management
- callback booking
- salesperson ranking
- advanced analytics
- Wallet passes
- billing
- AI brand extraction

Those are future roadmap items.

For now, build an exceptional AGG digital business card and a simple DeVision-managed workflow for adding AGG staff.

## Key product principle

BUILD AGG FIRST.
DO NOT BUILD AGG-ONLY.

AGG should be represented through tenant data, Brand DNA and the `drive` experience preset.

Never write shared UI logic like:

```ts
if (organisation.name === "AGG") ...
```

The same renderer architecture must later be usable for another organisation with different Brand DNA and experience configuration.

## AGG visual direction

Working experience name:

`drive`

Creative direction:

Premium automotive studio + precision credential.

The card should feel like a beautifully manufactured dark automotive object:
- graphite / deep dark lacquer
- controlled studio reflections
- precision polished edge
- subtle depth
- restrained translucent layers
- premium integrated portrait
- AGG logo treated like a badge/embedded physical mark
- deliberate typography
- subtle tactile motion

Avoid:
- generic dashboard UI
- giant rounded SaaS cards
- cyberpunk
- gaming
- rainbow/neon
- particles
- cheap glassmorphism
- obvious cursor-following gradient
- over-animation

The visual quality must survive the STATIC SCREENSHOT TEST:
with animation disabled, the card must already look premium.

## Identity hierarchy

Primary brand:
AGG

Secondary:
dealership/location

Tertiary:
represented marque(s), e.g. JAC / Jetour / Geely / MG as applicable

Employee identity must remain central.

Do not let the vehicle marque completely replace the AGG identity unless later required.

## Before making any code changes

Perform a repository audit.

Find and report:

1. framework/version
2. route structure
3. database/provider
4. auth implementation
5. organisation model
6. location/branch model if present
7. employee model
8. cards model
9. current brand/theme/Brand DNA model
10. existing public card route
11. existing admin preview route
12. existing DeVision/Dimension experience
13. Save Contact/vCard logic
14. Call logic
15. WhatsApp logic
16. Email logic
17. Website logic
18. Share logic
19. Copy logic
20. QR logic
21. analytics hooks if present
22. current animation dependencies
23. existing image/storage implementation
24. testing/lint/build scripts
25. deployment configuration

Then state:

- what should remain untouched
- what can be reused
- what needs extension
- what files you propose to modify/create
- whether a schema migration is actually required
- whether DOM/CSS perspective is sufficient for the AGG Drive card or WebGL adds material value

Do not invent filenames.

Do not ask me questions that can be answered by inspecting the repository.

## External brand reference

Use the current AGG website as a brand/content reference when browser access is available:

https://www.agg.co.za/

Use it to understand:
- AGG logo treatment
- real brand colours
- typography direction
- dealership naming
- associated vehicle brands
- overall brand character

Do not hotlink arbitrary website assets in production.

Do not guess exact AGG colours when a reliable brand source exists.

If browser access is unavailable:
- use approved AGG assets already in the repository
- preserve configurable tokens
- clearly identify any temporary placeholder

## Immediate milestone sequence

Do not build everything at once.

### Milestone A: Repository audit
No major visual rewrite yet.

### Milestone B: AGG data foundation
Make sure AGG, dealership/location, employee and relevant marque context can be represented cleanly through existing models.

Prefer extending existing tables over creating parallel models.

Create or verify one strong sample AGG employee card.

### Milestone C: Drive experience static composition
Build the reusable `drive` experience.

First achieve a premium static card:
- automotive dark environment
- physical card silhouette
- graphite/lacquer material
- portrait integration
- AGG badge/logo treatment
- premium name/title hierarchy
- dealership
- represented brands
- beautiful mobile composition

DO NOT add elaborate motion until the static design is excellent.

### Milestone D: Physical motion
Add restrained:
- pointer tilt
- multi-layer parallax
- independent studio reflection
- edge response
- short entrance
- reduced-motion fallback

Use requestAnimationFrame/CSS variables or existing performant motion tools.

Do not rerender React on every pointer event.

Do not rebuild critical text/buttons inside WebGL.

### Milestone E: Actions
Integrate existing:
- Save Contact
- Call
- WhatsApp
- Email
- Website
- Share
- Copy
- QR

Redesign presentation into a premium automotive action dock.

Preserve the working underlying functions.

### Milestone F: Reverse
Only if it materially improves the experience.

Possible reverse:
- AGG mark
- QR
- dealership
- direct details
- represented brands

Critical actions must remain available without flipping.

### Milestone G: DeVision admin management
Make AGG staff/location/card changes manageable without code.

Do not build a huge AGG self-service portal yet.

### Milestone H: testing and sales demo
Test mobile, desktop, reduced motion, missing photo, long names, multiple marques, links, QR and vCard.

## Architecture constraints

Public and preview cards must use the same renderer.

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

Potential experience registry:

```ts
const experiences = {
  drive: DriveExperience,
  dimension: DimensionExperience,
}
```

Adapt to current architecture.

Do not create duplicate implementation just to achieve this exact shape.

## Physical card details

The Drive card should visually contain multiple depth cues.

Potential layers:
- rear depth
- main body
- material texture
- portrait
- identity
- logo
- specular reflection
- polished edge
- clearcoat/front surface

Different visual layers may react at different intensity.

Maximum tilt should remain restrained, around 4 to 7 degrees or less after visual testing.

Portrait:
- avoid hard 50/50 web-layout split
- integrate into material with mask/falloff
- preserve skin tone
- subtle automotive grade
- optional edge light
- graceful monogram fallback

Logo:
- respect exact artwork
- badge/embedded treatment
- never distort or redraw
- do not over-glow

Typography:
- premium business-card typography
- clear name hierarchy
- quieter title
- restrained dealership/marque details
- use negative space

## Action hierarchy

1. Save Contact
2. Call / WhatsApp
3. Email / Website
4. Share / Copy / QR

Save Contact should be obvious but must not dominate the entire visual experience.

The card remains the hero.

## Mobile

Mobile is the main real-world environment.

Test:
- 320
- 375
- 390
- 430 px

No horizontal overflow.

No hover-only information.

No tilt behaviour that blocks scrolling.

No gyroscope permission.

## Reduced motion

Respect `prefers-reduced-motion`.

The reduced experience must remain premium and fully functional.

## Performance

Assume this will be opened via QR on mobile data.

Do not:
- ship huge textures
- use autoplay video
- require WebGL for identity
- block contact details on heavy code
- use giant blur effects everywhere

Prefer:
- DOM/CSS for critical content
- image optimisation
- lazy enhancement
- transforms/opacity
- requestAnimationFrame
- stable layout
- graceful fallback

## Visual iteration is mandatory

After the first design implementation:

1. run the app
2. open the AGG preview
3. inspect desktop
4. inspect about 390 px mobile
5. inspect static screenshot
6. inspect hover/tilt
7. inspect portrait integration
8. inspect action dock
9. inspect QR/reverse if present

Then perform at least one refinement pass if visual/browser tooling is available.

Do not declare success simply because TypeScript compiles.

Ask:

- Does this look automotive?
- Does this feel physical?
- Is AGG immediately recognisable?
- Is there any generic dashboard UI left?
- Is the card impressive before motion?
- Are we overusing effects?
- Does portrait integration feel expensive?
- Does the action dock support rather than dominate the hero?

## Preserve existing functionality

Do not break:
- authentication
- multi-tenancy
- public URLs
- preview
- database
- vCard
- QR
- native share
- copy
- call
- WhatsApp
- email
- website
- analytics if already present

## Checks

After each implementation milestone run the existing appropriate:
- lint
- typecheck
- tests
- production build

Fix errors before continuing.

## First action

Start with Milestone A only.

Inspect the repository and return a concise implementation map.

Then, unless you encounter a genuine architectural blocker, proceed into Milestone B.

Do NOT begin advanced motion or visual effects before AGG data resolution and the static Drive composition are clean.
