/**
 * Add vcard_download to the live analytics event enum.
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

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
  const pass = readEnv("DATABASE_PASSWORD");
  const sql = fs.readFileSync(
    path.join("supabase", "migrations", "20260813120000_vcard_download_event.sql"),
    "utf8",
  );
  const client = await connect(pass);
  try {
    await client.query(sql);
    const values = await client.query(`
      select enumlabel
      from pg_enum
      join pg_type on pg_enum.enumtypid = pg_type.oid
      where pg_type.typname = 'card_analytics_event_type'
      order by enumsortorder
    `);
    console.log("OK", values.rows.map((r) => r.enumlabel).join(", "));
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
