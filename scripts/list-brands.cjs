const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

(async () => {
  const pass = readEnv("DATABASE_PASSWORD");
  const ref = "gbattnbrqulqxlwhzaxx";
  const client = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const orgs = await client.query(
    "select id, name, slug, website, default_brand_kit_id from public.organisations",
  );
  const brands = await client.query(
    "select id, organisation_id, name, slug, website, logo_url, brand_kit_id from public.brands",
  );
  const kits = await client.query(
    "select id, organisation_id, brand_id, name, primary_colour, logo_url from public.brand_kits",
  );
  console.log(
    JSON.stringify({ orgs: orgs.rows, brands: brands.rows, kits: kits.rows }, null, 2),
  );
  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
