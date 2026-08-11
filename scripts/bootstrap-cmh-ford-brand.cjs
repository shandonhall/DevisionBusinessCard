/**
 * Phase 5: Create Ford brand under CMH Motor Group.
 *
 * Idempotent on (organisation slug cmh-motor-group, brand slug ford).
 * Does not create Ballito location / demo card (Phases 6-8).
 * Does not modify AGG.
 *
 * Usage: node scripts/bootstrap-cmh-ford-brand.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const ORG_SLUG = "cmh-motor-group";
const BRAND = {
  name: "Ford",
  slug: "ford",
  website: "https://cmhford.co.za/ballito/",
  logoUrl: "/brands/marques/ford-logo.png",
};

function dbCandidates(pass) {
  const ref = "gbattnbrqulqxlwhzaxx";
  const host = "aws-0-eu-west-2.pooler.supabase.com";
  const user = `postgres.${ref}`;
  const urls = [];
  if (fs.existsSync(".db-url.tmp")) {
    urls.push({
      connectionString: fs.readFileSync(".db-url.tmp", "utf8").trim(),
    });
  }
  urls.push(
    {
      connectionString: `postgresql://${user}:${encodeURIComponent(pass)}@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false },
    },
    // DNS fallback IPs for eu-west-2 pooler (local resolver can flake)
    {
      host: "18.169.28.97",
      port: 6543,
      user,
      password: pass,
      database: "postgres",
      ssl: { rejectUnauthorized: false, servername: host },
    },
    {
      host: "18.135.253.94",
      port: 6543,
      user,
      password: pass,
      database: "postgres",
      ssl: { rejectUnauthorized: false, servername: host },
    },
  );
  return urls;
}

async function connect(pass) {
  const candidates = dbCandidates(pass);
  let lastError = null;
  for (const config of candidates) {
    const client = new Client({
      ...config,
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      return client;
    } catch (e) {
      lastError = e;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw lastError ?? new Error("No database connection");
}

(async () => {
  const pass = readEnv("DATABASE_PASSWORD");
  const client = await connect(pass);
  await client.query("begin");

  try {
    const org = await client.query(
      `select id, name, slug from public.organisations where slug = $1`,
      [ORG_SLUG],
    );
    if (!org.rows[0]) {
      throw new Error(
        "CMH Motor Group missing - run npm run seed:cmh-org first",
      );
    }
    const organisationId = org.rows[0].id;

    const existing = await client.query(
      `select id, name, slug, status, website, logo_url, brand_kit_id
       from public.brands
       where organisation_id = $1 and slug = $2`,
      [organisationId, BRAND.slug],
    );

    if (existing.rows.length > 0) {
      await client.query(
        `update public.brands
         set website = coalesce(website, $1),
             logo_url = coalesce(logo_url, $2),
             status = 'active',
             updated_at = now()
         where id = $3`,
        [BRAND.website, BRAND.logoUrl, existing.rows[0].id],
      );
      await client.query("commit");
      console.log("SKIP - Ford brand already exists under CMH", {
        organisationId,
        brand: existing.rows[0],
      });
      await client.end();
      return;
    }

    // Ford marque kit (DNA source of truth for this brand; Phase 7 may refine)
    const kit = await client.query(
      `insert into public.brand_kits (
         organisation_id, name,
         primary_colour, secondary_colour, accent_colour,
         background_colour, surface_colour, text_colour, muted_text_colour,
         heading_font, body_font,
         button_radius, card_radius,
         border_style, shadow_style, background_style,
         logo_url, default_layout_id, experience_preset, experience_config
       ) values (
         $1, 'Ford Drive',
         '#003478', '#001E44', '#66A3FF',
         '#05070B', '#0E141C', '#F4F7FB', '#93A4B8',
         'Montserrat', 'Source Sans 3',
         '4px', '12px',
         'subtle', 'soft', 'solid',
         $2, 'modern', 'drive',
         $3::jsonb
       )
       returning id`,
      [
        organisationId,
        BRAND.logoUrl,
        JSON.stringify({
          brandPreset: "ford",
          tiltStrength: 0.46,
          reflectionStrength: 0.64,
          chromaticIntensity: 0.2,
          environmentTone: "studio-dark",
          sourceUrl: BRAND.website,
        }),
      ],
    );
    const brandKitId = kit.rows[0].id;

    const brand = await client.query(
      `insert into public.brands (
         organisation_id, name, slug, status, website, logo_url, brand_kit_id
       ) values ($1, $2, $3, 'active', $4, $5, $6)
       returning id, name, slug, status, website, logo_url, brand_kit_id`,
      [
        organisationId,
        BRAND.name,
        BRAND.slug,
        BRAND.website,
        BRAND.logoUrl,
        brandKitId,
      ],
    );

    // Wire kit.brand_id now that the brand exists (same-org trigger)
    await client.query(
      `update public.brand_kits set brand_id = $1 where id = $2`,
      [brand.rows[0].id, brandKitId],
    );

    // Isolation sanity: Ford must not exist under AGG
    const aggLeak = await client.query(
      `select b.id
       from public.brands b
       join public.organisations o on o.id = b.organisation_id
       where o.slug = 'agg' and b.slug = 'ford'`,
    );
    if (aggLeak.rows.length > 0) {
      throw new Error("Ford brand unexpectedly found under AGG - aborting");
    }

    await client.query("commit");
    console.log("CREATED Ford brand under CMH Motor Group", {
      organisationId,
      organisationSlug: ORG_SLUG,
      brand: brand.rows[0],
      brandKitId,
      next: "Phase 6 - create CMH Ford Ballito location",
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
