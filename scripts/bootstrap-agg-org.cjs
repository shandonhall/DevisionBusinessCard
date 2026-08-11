/**
 * Seed AGG Motors org for Milestone B verification.
 * Idempotent on org slug `agg` - skips create if already present.
 *
 * Usage: node scripts/bootstrap-agg-org.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const USER_ID = "706e415b-4370-4a85-b2d9-df199869a090";
const ORG_NAME = "AGG Motors";
const ORG_SLUG = "agg";

const MARQUES = [
  { name: "Geely", slug: "geely", website: "https://www.geely.com", sort: 0 },
  { name: "Jetour", slug: "jetour", website: "https://www.jetour.com", sort: 1 },
  { name: "MG", slug: "mg", website: "https://www.mg.co.za", sort: 2 },
  { name: "JAC", slug: "jac", website: "https://www.jacmotors.co.za", sort: 3 },
];

const LOCATIONS = [
  {
    name: "AGG Northcliff",
    slug: "northcliff",
    address: "Northcliff, Johannesburg",
    marques: ["geely", "jetour", "mg", "jac"],
  },
  {
    name: "AGG Ontdekkers",
    slug: "ontdekkers",
    address: "Ontdekkers Road, Roodepoort",
    marques: ["geely", "jetour", "mg", "jac"],
  },
  {
    name: "AGG Westrand",
    slug: "westrand",
    address: "West Rand, Gauteng",
    marques: ["geely", "jetour", "jac"],
  },
  {
    name: "MG Bryanston",
    slug: "mg-bryanston",
    address: "Bryanston, Sandton",
    marques: ["mg"],
  },
];

(async () => {
  const pass = readEnv("DATABASE_PASSWORD");
  const ref = "gbattnbrqulqxlwhzaxx";
  const client = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query("begin");

  try {
    const existing = await client.query(
      `select id, slug from public.organisations where slug = $1`,
      [ORG_SLUG],
    );
    if (existing.rows.length > 0) {
      await client.query("rollback");
      console.log("SKIP - org already exists", existing.rows[0]);
      await client.end();
      return;
    }

    const org = await client.query(
      `insert into public.organisations (name, slug, status, website, white_label_enabled)
       values ($1, $2, 'active', 'https://www.agg.co.za', true)
       returning id`,
      [ORG_NAME, ORG_SLUG],
    );
    const organisationId = org.rows[0].id;

    await client.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin')
       on conflict (user_id, organisation_id) do nothing`,
      [USER_ID, organisationId],
    );

    // AGG corporate kit + drive preset (no org-name branching - DNA via preset)
    const kit = await client.query(
      `insert into public.brand_kits (
         organisation_id, name,
         primary_colour, secondary_colour, accent_colour,
         background_colour, surface_colour, text_colour, muted_text_colour,
         heading_font, body_font,
         button_radius, card_radius,
         border_style, shadow_style, background_style,
         default_layout_id, experience_preset, experience_config
       ) values (
         $1, 'AGG Drive',
         '#2D3E40', '#1A2628', '#D4A017',
         '#0F1415', '#1A2426', '#F4F6F6', '#9AA6A8',
         'Outfit', 'Source Sans 3',
         '6px', '12px',
         'subtle', 'soft', 'solid',
         'modern', 'drive',
         $2::jsonb
       )
       returning id`,
      [
        organisationId,
        JSON.stringify({
          tiltStrength: 0.48,
          reflectionStrength: 0.62,
          environmentTone: "studio-dark",
        }),
      ],
    );
    const kitId = kit.rows[0].id;

    await client.query(
      `update public.organisations set default_brand_kit_id = $1 where id = $2`,
      [kitId, organisationId],
    );

    const corporate = await client.query(
      `insert into public.brands (organisation_id, name, slug, status, website, brand_kit_id)
       values ($1, 'AGG Motors', 'agg-motors', 'active', 'https://www.agg.co.za', $2)
       returning id`,
      [organisationId, kitId],
    );
    const corporateBrandId = corporate.rows[0].id;

    const marqueIds = {};
    for (const m of MARQUES) {
      const row = await client.query(
        `insert into public.brands (organisation_id, name, slug, status, website)
         values ($1, $2, $3, 'active', $4)
         returning id, slug`,
        [organisationId, m.name, m.slug, m.website],
      );
      marqueIds[row.rows[0].slug] = row.rows[0].id;
    }

    let northcliffId = null;
    for (const loc of LOCATIONS) {
      const row = await client.query(
        `insert into public.locations (
           organisation_id, brand_id, name, slug, type, address, website, status
         ) values ($1, $2, $3, $4, 'dealership', $5, 'https://www.agg.co.za', 'active')
         returning id, slug`,
        [organisationId, corporateBrandId, loc.name, loc.slug, loc.address],
      );
      const locationId = row.rows[0].id;
      if (loc.slug === "northcliff") northcliffId = locationId;

      let sort = 0;
      for (const marqueSlug of loc.marques) {
        await client.query(
          `insert into public.location_brands (location_id, brand_id, sort_order)
           values ($1, $2, $3)`,
          [locationId, marqueIds[marqueSlug], sort++],
        );
      }
    }

    const employee = await client.query(
      `insert into public.employees (
         organisation_id, brand_id, location_id,
         first_name, last_name, display_name, job_title, department,
         email, mobile, whatsapp, bio, status
       ) values (
         $1, null, $2,
         'Thabo', 'Molefe', 'Thabo Molefe', 'Sales Executive', 'Sales',
         'thabo.molefe@agg.co.za', '+27821234567', '+27821234567',
         'Helping clients find the right Geely, Jetour, MG or JAC.',
         'active'
       )
       returning id`,
      [organisationId, northcliffId],
    );
    const employeeId = employee.rows[0].id;

    let sort = 0;
    for (const m of MARQUES) {
      await client.query(
        `insert into public.employee_brands (employee_id, brand_id, sort_order)
         values ($1, $2, $3)`,
        [employeeId, marqueIds[m.slug], sort++],
      );
    }

    const card = await client.query(
      `insert into public.cards (
         organisation_id, employee_id, slug, public_status, layout_id,
         page_title, meta_description, primary_cta_label, primary_cta_url,
         published_at
       ) values (
         $1, $2, 'thabo-molefe', 'active', 'modern',
         'Thabo Molefe · AGG Motors',
         'Sales Executive at AGG Northcliff',
         'WhatsApp Thabo',
         'https://wa.me/27821234567',
         now()
       )
       returning id, slug`,
      [organisationId, employeeId],
    );

    const sectionTypes = [
      "hero",
      "contact_actions",
      "about",
      "social_links",
    ];
    for (let i = 0; i < sectionTypes.length; i++) {
      await client.query(
        `insert into public.card_sections (card_id, type, sort_order, enabled, config_json)
         values ($1, $2, $3, true, '{}'::jsonb)`,
        [card.rows[0].id, sectionTypes[i], i],
      );
    }

    await client.query("commit");
    console.log("CREATED AGG seed", {
      organisationId,
      slug: ORG_SLUG,
      kitId,
      corporateBrandId,
      marques: marqueIds,
      employeeId,
      cardSlug: card.rows[0].slug,
      publicPath: `/${ORG_SLUG}/${card.rows[0].slug}`,
    });
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
