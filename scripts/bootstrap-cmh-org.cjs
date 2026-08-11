/**
 * Phase 4: Create CMH Motor Group organisation (tenant shell only).
 *
 * Idempotent on org slug `cmh-motor-group`.
 * Does NOT create Ford brand / Ballito location / demo card (Phases 5-8).
 * Does NOT copy AGG memberships, brands, or DNA.
 *
 * Usage: node scripts/bootstrap-cmh-org.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

/** DeVision Platform Admin — may switch into CMH after creation. */
const PLATFORM_ADMIN_USER_ID = "706e415b-4370-4a85-b2d9-df199869a090";

const ORG = {
  name: "CMH Motor Group",
  slug: "cmh-motor-group",
  legalName: "CMH Motor Group",
  website: "https://cmhford.co.za/ballito/",
};

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
      `select id, name, slug, status, white_label_enabled, website
       from public.organisations
       where slug = $1`,
      [ORG.slug],
    );

    if (existing.rows.length > 0) {
      const org = existing.rows[0];

      await client.query(
        `insert into public.memberships (user_id, organisation_id, role)
         values ($1, $2, 'organisation_admin')
         on conflict (user_id, organisation_id) do nothing`,
        [PLATFORM_ADMIN_USER_ID, org.id],
      );

      await client.query("commit");
      console.log("SKIP - CMH organisation already exists", {
        organisationId: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        white_label_enabled: org.white_label_enabled,
        website: org.website,
      });
      await client.end();
      return;
    }

    // Ensure AGG still exists and remains untouched
    const agg = await client.query(
      `select id, slug from public.organisations where slug = 'agg'`,
    );
    if (agg.rows.length === 0) {
      throw new Error("AGG Motors (slug=agg) not found — aborting CMH create");
    }

    const orgInsert = await client.query(
      `insert into public.organisations (
         name, slug, legal_name, status, website, white_label_enabled
       ) values ($1, $2, $3, 'active', $4, true)
       returning id, name, slug, status, white_label_enabled, website`,
      [ORG.name, ORG.slug, ORG.legalName, ORG.website],
    );
    const organisation = orgInsert.rows[0];

    await client.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin')
       on conflict (user_id, organisation_id) do nothing`,
      [PLATFORM_ADMIN_USER_ID, organisation.id],
    );

    // Placeholder org kit only — Ford Drive DNA arrives in Phase 7.
    // Colours here are neutral CMH-safe placeholders, not AGG gold.
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
         $1, 'CMH Organisation Default',
         '#1B1B1B', '#333333', '#003478',
         '#0B0B0B', '#161616', '#F5F5F5', '#A3A3A3',
         'Montserrat', 'Open Sans',
         '4px', '10px',
         'subtle', 'soft', 'solid',
         'modern', 'drive',
         $2::jsonb
       )
       returning id`,
      [
        organisation.id,
        JSON.stringify({
          tiltStrength: 0.45,
          reflectionStrength: 0.55,
          environmentTone: "studio-dark",
          note: "Placeholder org kit — Ford marque DNA set in Phase 7",
        }),
      ],
    );

    await client.query(
      `update public.organisations
       set default_brand_kit_id = $1
       where id = $2`,
      [kit.rows[0].id, organisation.id],
    );

    // Sanity: CMH must not share AGG brand kits / memberships incorrectly
    const crossCheck = await client.query(
      `select count(*)::int as shared_kits
       from public.brand_kits
       where organisation_id = $1
         and id in (
           select id from public.brand_kits where organisation_id = $2
         )`,
      [organisation.id, agg.rows[0].id],
    );

    if (crossCheck.rows[0].shared_kits > 0) {
      throw new Error("Cross-tenant brand kit leak detected — rolled back");
    }

    await client.query("commit");
    console.log("CREATED CMH Motor Group organisation", {
      organisationId: organisation.id,
      name: organisation.name,
      slug: organisation.slug,
      status: organisation.status,
      white_label_enabled: organisation.white_label_enabled,
      website: organisation.website,
      defaultBrandKitId: kit.rows[0].id,
      platformAdminMembership: PLATFORM_ADMIN_USER_ID,
      peerOrg: { slug: "agg", id: agg.rows[0].id },
      next: "Phase 5 — create Ford brand under this organisation",
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
