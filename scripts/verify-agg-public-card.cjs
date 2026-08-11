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
  const { rows } = await client.query(
    `select public.get_public_card($1, $2) as payload`,
    ["agg", "thabo-molefe"],
  );
  const p = rows[0].payload;
  if (!p) {
    console.error("FAIL: get_public_card returned null");
    process.exit(1);
  }
  const marques = (p.marques || []).map((m) => m.slug);
  const preset = p.organisation_kit && p.organisation_kit.experience_preset;
  console.log(
    JSON.stringify(
      {
        org: p.organisation.slug,
        card: p.card.slug,
        employee: p.employee.display_name,
        preset,
        marques,
      },
      null,
      2,
    ),
  );
  if (preset !== "drive") {
    console.error("FAIL: expected experience_preset drive");
    process.exit(1);
  }
  if (marques.length < 4) {
    console.error("FAIL: expected 4 marques, got", marques);
    process.exit(1);
  }
  console.log("OK - public card resolves with drive + marques");
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
