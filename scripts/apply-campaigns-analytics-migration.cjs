/**
 * Apply campaigns + analytics migration to the live database.
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
    path.join("supabase", "migrations", "20260813000000_campaigns_and_analytics.sql"),
    "utf8",
  );
  const client = await connect(pass);
  try {
    await client.query(sql);
    const tables = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('campaigns', 'card_analytics_events')
      order by table_name
    `);
    console.log("OK", tables.rows.map((r) => r.table_name).join(", "));
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
