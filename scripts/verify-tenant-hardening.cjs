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

  const policies = await client.query(`
    select polname
    from pg_policy
    where polrelid = 'public.organisations'::regclass
    order by 1
  `);
  const profileTriggers = await client.query(`
    select tgname
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and not tgisinternal
    order by 1
  `);
  const employeeTriggers = await client.query(`
    select tgname
    from pg_trigger
    where tgrelid = 'public.employees'::regclass
      and not tgisinternal
    order by 1
  `);

  console.log(
    "org policies:",
    policies.rows.map((r) => r.polname).join(", "),
  );
  console.log(
    "profile triggers:",
    profileTriggers.rows.map((r) => r.tgname).join(", "),
  );
  console.log(
    "employee triggers:",
    employeeTriggers.rows.map((r) => r.tgname).join(", "),
  );

  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
