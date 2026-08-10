const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString = fs
  .readFileSync(".db-url.tmp", "utf8")
  .trim()
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/\?$/, "");
const migrationsDir = path.join("supabase", "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

(async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Applying", files.length, "migrations…");

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`→ ${file} … `);
    try {
      await client.query(sql);
      console.log("ok");
    } catch (e) {
      console.log("FAIL");
      console.error(e.message);
      await client.end();
      process.exit(1);
    }
  }

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'organisations','memberships','profiles','brand_kits',
        'brands','locations','employees','cards','card_sections',
        'card_slug_redirects'
      )
    order by table_name
  `);
  console.log(
    "Tables present:",
    tables.rows.map((r) => r.table_name).join(", "),
  );

  const fns = await client.query(`
    select proname from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('get_public_card','resolve_public_card')
    order by proname
  `);
  console.log(
    "Functions present:",
    fns.rows.map((r) => r.proname).join(", "),
  );

  await client.end();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
