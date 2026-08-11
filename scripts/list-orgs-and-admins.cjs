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
    `select id, name, slug, status, white_label_enabled, website
     from public.organisations
     order by name`,
  );
  const admins = await client.query(
    `select id, email, full_name, is_platform_admin, status
     from public.profiles
     where is_platform_admin = true
     order by email`,
  );
  const memberships = await client.query(
    `select p.email, o.slug, m.role
     from public.memberships m
     join public.profiles p on p.id = m.user_id
     join public.organisations o on o.id = m.organisation_id
     where p.is_platform_admin = true
     order by p.email, o.slug`,
  );

  console.log("ORGS", JSON.stringify(orgs.rows, null, 2));
  console.log("PLATFORM_ADMINS", JSON.stringify(admins.rows, null, 2));
  console.log("PLATFORM_MEMBERSHIPS", JSON.stringify(memberships.rows, null, 2));
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
