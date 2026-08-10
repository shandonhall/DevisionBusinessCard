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
  await client.query("begin");
  try {
    const org = await client.query(
      `select id, default_brand_kit_id from organisations where slug = 'agg'`,
    );
    if (!org.rows[0]) throw new Error("AGG org missing");
    const organisationId = org.rows[0].id;
    const kitId = org.rows[0].default_brand_kit_id;

    await client.query(
      `update brand_kits set
         heading_font = 'Montserrat',
         body_font = 'Poppins',
         logo_url = '/brands/agg/agg-logo.png',
         primary_colour = '#2D3E40',
         secondary_colour = '#1A2628',
         accent_colour = '#C9A962',
         background_colour = '#07090B',
         surface_colour = '#12161A',
         text_colour = '#F2F0EB',
         muted_text_colour = '#9AA6A8',
         experience_preset = 'drive',
         updated_at = now()
       where id = $1`,
      [kitId],
    );

    await client.query(
      `update brands set logo_url = '/brands/agg/agg-logo.png', brand_kit_id = $2
       where organisation_id = $1 and slug = 'agg-motors'`,
      [organisationId, kitId],
    );

    const marqueLogos = {
      geely: "/brands/marques/geely.png",
      jetour: "/brands/marques/jetour.png",
      mg: "/brands/marques/mg.png",
      jac: "/brands/marques/jac.png",
    };
    for (const [slug, logo] of Object.entries(marqueLogos)) {
      await client.query(
        `update brands set logo_url = $3
         where organisation_id = $1 and slug = $2`,
        [organisationId, slug, logo],
      );
    }

    await client.query("commit");
    console.log("UPDATED AGG kit + logos", { kitId, organisationId });
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
