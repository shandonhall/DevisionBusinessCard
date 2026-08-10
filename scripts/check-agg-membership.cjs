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
  const userId = "706e415b-4370-4a85-b2d9-df199869a090";
  const orgs = await client.query(
    `select o.name, o.slug, m.role
     from organisations o
     join memberships m on m.organisation_id = o.id
     where m.user_id = $1
     order by o.name`,
    [userId],
  );
  const brands = await client.query(
    `select o.slug as org, b.name, b.slug
     from brands b
     join organisations o on o.id = b.organisation_id
     where o.slug in ('agg', 'devision-media')
     order by o.slug, b.name`,
  );
  console.log(JSON.stringify({ memberships: orgs.rows, brands: brands.rows }, null, 2));
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
