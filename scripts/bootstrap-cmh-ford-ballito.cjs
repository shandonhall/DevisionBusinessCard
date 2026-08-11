/**
 * Phase 6: Create CMH Ford Ballito location under CMH / Ford.
 *
 * Idempotent on (organisation slug cmh-motor-group, location slug cmh-ford-ballito).
 * Does not create demo employee/card (Phase 8).
 * Does not modify AGG.
 *
 * Usage: node scripts/bootstrap-cmh-ford-ballito.cjs
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
const BRAND_SLUG = "ford";
const LOCATION = {
  name: "CMH Ford Ballito",
  slug: "cmh-ford-ballito",
  type: "dealership",
  address: "Ballito, KwaZulu-Natal, South Africa",
  website: "https://cmhford.co.za/ballito/",
  phone: null,
  email: null,
};

function dbCandidates(pass) {
  const ref = "gbattnbrqulqxlwhzaxx";
  const host = "aws-0-eu-west-2.pooler.supabase.com";
  const user = `postgres.${ref}`;
  return [
    {
      connectionString: `postgresql://${user}:${encodeURIComponent(pass)}@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false },
    },
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
  ];
}

async function connect(pass) {
  let lastError = null;
  for (const config of dbCandidates(pass)) {
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
      throw new Error("CMH Motor Group missing - run npm run seed:cmh-org first");
    }
    const organisationId = org.rows[0].id;

    const brand = await client.query(
      `select id, name, slug from public.brands
       where organisation_id = $1 and slug = $2`,
      [organisationId, BRAND_SLUG],
    );
    if (!brand.rows[0]) {
      throw new Error("Ford brand missing - run npm run seed:cmh-ford-brand first");
    }
    const brandId = brand.rows[0].id;

    const existing = await client.query(
      `select id, name, slug, type, address, website, phone, email, status, brand_id
       from public.locations
       where organisation_id = $1 and slug = $2`,
      [organisationId, LOCATION.slug],
    );

    let location;
    if (existing.rows.length > 0) {
      const updated = await client.query(
        `update public.locations
         set name = $1,
             brand_id = $2,
             type = $3::public.location_type,
             address = $4,
             website = $5,
             status = 'active',
             updated_at = now()
         where id = $6
         returning id, name, slug, type, address, website, status, brand_id`,
        [
          LOCATION.name,
          brandId,
          LOCATION.type,
          LOCATION.address,
          LOCATION.website,
          existing.rows[0].id,
        ],
      );
      location = updated.rows[0];
      console.log("UPDATED existing CMH Ford Ballito location");
    } else {
      const inserted = await client.query(
        `insert into public.locations (
           organisation_id, brand_id, name, slug, type,
           address, website, phone, email, status
         ) values (
           $1, $2, $3, $4, $5::public.location_type,
           $6, $7, $8, $9, 'active'
         )
         returning id, name, slug, type, address, website, status, brand_id`,
        [
          organisationId,
          brandId,
          LOCATION.name,
          LOCATION.slug,
          LOCATION.type,
          LOCATION.address,
          LOCATION.website,
          LOCATION.phone,
          LOCATION.email,
        ],
      );
      location = inserted.rows[0];
      console.log("CREATED CMH Ford Ballito location");
    }

    // Marque assignment: Ballito sells Ford
    await client.query(
      `insert into public.location_brands (location_id, brand_id, sort_order)
       values ($1, $2, 0)
       on conflict (location_id, brand_id) do nothing`,
      [location.id, brandId],
    );

    // Isolation checks
    const wrongOrg = await client.query(
      `select id from public.locations
       where id = $1 and organisation_id <> $2`,
      [location.id, organisationId],
    );
    if (wrongOrg.rows.length > 0) {
      throw new Error("Location organisation mismatch");
    }

    const aggLeak = await client.query(
      `select l.id
       from public.locations l
       join public.organisations o on o.id = l.organisation_id
       where o.slug = 'agg' and l.slug = $1`,
      [LOCATION.slug],
    );
    if (aggLeak.rows.length > 0) {
      throw new Error("CMH Ford Ballito unexpectedly found under AGG");
    }

    const crossBrand = await client.query(
      `select lb.location_id
       from public.location_brands lb
       join public.brands b on b.id = lb.brand_id
       where lb.location_id = $1
         and b.organisation_id <> $2`,
      [location.id, organisationId],
    );
    if (crossBrand.rows.length > 0) {
      throw new Error("Cross-tenant brand linked to Ballito location");
    }

    await client.query("commit");
    console.log({
      organisationId,
      organisationSlug: ORG_SLUG,
      brandId,
      brandSlug: BRAND_SLUG,
      location,
      next: "Phase 7/8 - Ford DNA refine + demo employee/card",
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
