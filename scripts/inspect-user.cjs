const { Client } = require("pg");
const fs = require("fs");
const dns = require("dns").promises;

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

async function connect() {
  const pass = readEnv("DATABASE_PASSWORD");
  const ref = "gbattnbrqulqxlwhzaxx";
  const host = "aws-0-eu-west-2.pooler.supabase.com";
  const port = 6543;
  const client = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:${port}/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

(async () => {
  const client = await connect();
  const users = await client.query(
    `select id, email, raw_user_meta_data from auth.users order by created_at desc limit 5`,
  );
  console.log(
    "USERS",
    JSON.stringify(
      users.rows.map((u) => ({
        id: u.id,
        email: u.email,
        meta: u.raw_user_meta_data,
      })),
      null,
      2,
    ),
  );
  const orgs = await client.query(`select id, name, slug from public.organisations`);
  console.log("ORGS", orgs.rows);
  const mem = await client.query(
    `select user_id, organisation_id, role from public.memberships`,
  );
  console.log("MEMBERSHIPS", mem.rows);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
