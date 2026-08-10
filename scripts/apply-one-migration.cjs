const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

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
  const file = process.argv[2];
  const sql = fs.readFileSync(path.resolve(file), "utf8");
  await client.query(sql);
  console.log("Applied", file);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
