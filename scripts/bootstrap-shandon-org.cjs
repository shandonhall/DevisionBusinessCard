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

  const userId = "706e415b-4370-4a85-b2d9-df199869a090";
  const name = "DeVision Media";
  const slug = "devision-media";

  await client.query("begin");
  try {
    const org = await client.query(
      `insert into public.organisations (name, slug, status)
       values ($1, $2, 'active')
       returning id, name, slug`,
      [name, slug],
    );
    const organisationId = org.rows[0].id;

    await client.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin')`,
      [userId, organisationId],
    );

    const kit = await client.query(
      `insert into public.brand_kits (organisation_id, name)
       values ($1, $2)
       returning id`,
      [organisationId, "Default"],
    );

    await client.query(
      `update public.organisations
       set default_brand_kit_id = $1
       where id = $2`,
      [kit.rows[0].id, organisationId],
    );

    await client.query("commit");
    console.log("CREATED", { organisationId, name, slug, kitId: kit.rows[0].id });
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
