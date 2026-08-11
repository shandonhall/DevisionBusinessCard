/**
 * Point CMH Ford brand assets at the local CMH Ford Ballito logo copy.
 * Usage: node scripts/update-cmh-ford-logo.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const LOGO = "/brands/marques/ford-logo.png";

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
  if (!fs.existsSync("public/brands/marques/ford-logo.png")) {
    throw new Error("Missing public/brands/marques/ford-logo.png");
  }

  const client = await connect(readEnv("DATABASE_PASSWORD"));
  await client.query("begin");
  try {
    const brand = await client.query(
      `update public.brands b
       set logo_url = $1, updated_at = now()
       from public.organisations o
       where b.organisation_id = o.id
         and o.slug = 'cmh-motor-group'
         and b.slug = 'ford'
       returning b.id, b.logo_url, b.brand_kit_id`,
      [LOGO],
    );
    if (!brand.rows[0]) throw new Error("Ford brand not found under CMH");

    if (brand.rows[0].brand_kit_id) {
      await client.query(
        `update public.brand_kits
         set logo_url = $1, updated_at = now()
         where id = $2`,
        [LOGO, brand.rows[0].brand_kit_id],
      );
    }

    await client.query("commit");
    console.log("UPDATED Ford logo paths", {
      brandId: brand.rows[0].id,
      logoUrl: LOGO,
      source: "https://cmhford.co.za/wp-content/uploads/2022/09/ford_logo.png",
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
