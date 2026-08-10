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

  const migration = fs.readFileSync(
    "supabase/migrations/20260310190000_brand_experience.sql",
    "utf8",
  );
  await client.query(migration);
  console.log("migration applied");

  // Enable Dimension for DeVision kits by organisation slug / brand website — data only.
  const updated = await client.query(
    `update public.brand_kits bk
     set experience_preset = 'dimension',
         updated_at = now()
     from public.organisations o
     where bk.organisation_id = o.id
       and (
         o.slug = 'devision-media'
         or bk.brand_id in (
           select b.id from public.brands b
           where b.organisation_id = o.id
             and (
               b.slug = 'devision-media'
               or b.website ilike '%devisionmedia.co.za%'
             )
         )
       )
     returning bk.id, bk.name, bk.experience_preset`,
  );
  console.log("kits updated", updated.rows);

  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
