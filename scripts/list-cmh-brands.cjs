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
  const client = new Client({
    connectionString: `postgresql://postgres.gbattnbrqulqxlwhzaxx:${encodeURIComponent(pass)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const org = await client.query(
    `select id, name, slug from organisations where slug = 'cmh-motor-group'`,
  );
  if (!org.rows[0]) throw new Error("CMH org missing");
  const brands = await client.query(
    `select id, name, slug, status, website, logo_url, brand_kit_id
     from brands where organisation_id = $1 order by name`,
    [org.rows[0].id],
  );
  console.log(JSON.stringify({ org: org.rows[0], brands: brands.rows }, null, 2));
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
