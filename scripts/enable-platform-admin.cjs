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
  const { rows } = await client.query(
    `update profiles
     set is_platform_admin = true
     where id = $1
     returning id, email, is_platform_admin`,
    ["706e415b-4370-4a85-b2d9-df199869a090"],
  );
  console.log("UPDATED", rows[0]);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
