/**
 * Idempotent AGG Drive marque demo cards (draft only).
 * Usage: node scripts/seed-agg-marque-demos.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const DEMOS = [
  {
    key: "demo-agg-group",
    first: "Morgan",
    last: "Ellis",
    display: "Morgan Ellis",
    title: "Group Sales Executive",
    dept: "Group Sales",
    email: "demo.group@example.agg.local",
    mobile: "+27820001001",
    whatsapp: "+27820001001",
    slug: "demo-morgan-ellis",
    locationSlug: null,
    marques: [],
    pageTitle: "Demo · AGG Group",
    photo: "/demos/portraits/morgan-ellis.jpg",
  },
  {
    key: "demo-geely",
    first: "Alex",
    last: "Morgan",
    display: "Alex Morgan",
    title: "Sales Executive",
    dept: "Sales",
    email: "demo.geely@example.agg.local",
    mobile: "+27820001002",
    whatsapp: "+27820001002",
    slug: "demo-alex-morgan",
    locationSlug: "northcliff",
    marques: ["geely"],
    pageTitle: "Demo · Geely",
    photo: "/demos/portraits/alex-morgan.jpg",
  },
  {
    key: "demo-jetour",
    first: "Jordan",
    last: "Naidoo",
    display: "Jordan Naidoo",
    title: "Sales Executive",
    dept: "Sales",
    email: "demo.jetour@example.agg.local",
    mobile: "+27820001003",
    whatsapp: "+27820001003",
    slug: "demo-jordan-naidoo",
    locationSlug: "ontdekkers",
    marques: ["jetour"],
    pageTitle: "Demo · Jetour",
    photo: "/demos/portraits/jordan-naidoo.jpg",
  },
  {
    key: "demo-mg",
    first: "Taylor",
    last: "Mokoena",
    display: "Taylor Mokoena",
    title: "Sales Executive",
    dept: "Sales",
    email: "demo.mg@example.agg.local",
    mobile: "+27820001004",
    whatsapp: "+27820001004",
    slug: "demo-taylor-mokoena",
    locationSlug: "mg-bryanston",
    marques: ["mg"],
    pageTitle: "Demo · MG",
    photo: "/demos/portraits/taylor-mokoena.jpg",
  },
  {
    key: "demo-jac",
    first: "Sam",
    last: "Daniels",
    display: "Sam Daniels",
    title: "Sales Executive",
    dept: "Sales",
    email: "demo.jac@example.agg.local",
    mobile: "+27820001005",
    whatsapp: "+27820001005",
    slug: "demo-sam-daniels",
    locationSlug: "northcliff",
    marques: ["jac"],
    pageTitle: "Demo · JAC",
    photo: "/demos/portraits/sam-daniels.jpg",
  },
];

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
      `select id from organisations where slug = 'agg'`,
    );
    if (!org.rows[0]) throw new Error("AGG org missing - run bootstrap-agg-org.cjs first");
    const organisationId = org.rows[0].id;

    const brands = await client.query(
      `select id, slug from brands where organisation_id = $1`,
      [organisationId],
    );
    const brandBySlug = Object.fromEntries(brands.rows.map((b) => [b.slug, b.id]));

    const locations = await client.query(
      `select id, slug from locations where organisation_id = $1`,
      [organisationId],
    );
    const locationBySlug = Object.fromEntries(
      locations.rows.map((l) => [l.slug, l.id]),
    );

    const created = [];

    for (const demo of DEMOS) {
      const existing = await client.query(
        `select id from employees
         where organisation_id = $1 and employee_reference = $2`,
        [organisationId, demo.key],
      );

      let employeeId;
      const locationId = demo.locationSlug
        ? locationBySlug[demo.locationSlug] || null
        : null;
      const primaryBrandId =
        demo.marques.length === 1 ? brandBySlug[demo.marques[0]] || null : null;

      if (existing.rows[0]) {
        employeeId = existing.rows[0].id;
        await client.query(
          `update employees set
             first_name = $2, last_name = $3, display_name = $4,
             job_title = $5, department = $6, email = $7,
             mobile = $8, whatsapp = $9,
             brand_id = $10, location_id = $11, status = 'active',
             bio = $12, profile_photo_url = $13, updated_at = now()
           where id = $1`,
          [
            employeeId,
            demo.first,
            demo.last,
            demo.display,
            demo.title,
            demo.dept,
            demo.email,
            demo.mobile,
            demo.whatsapp,
            primaryBrandId,
            locationId,
            `DEMO record - fictional salesperson for ${demo.pageTitle} pitch preview.`,
            demo.photo,
          ],
        );
      } else {
        const emp = await client.query(
          `insert into employees (
             organisation_id, brand_id, location_id,
             first_name, last_name, display_name, job_title, department,
             email, mobile, whatsapp, bio, status, employee_reference,
             profile_photo_url
           ) values (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14
           ) returning id`,
          [
            organisationId,
            primaryBrandId,
            locationId,
            demo.first,
            demo.last,
            demo.display,
            demo.title,
            demo.dept,
            demo.email,
            demo.mobile,
            demo.whatsapp,
            `DEMO record - fictional salesperson for ${demo.pageTitle} pitch preview.`,
            demo.key,
            demo.photo,
          ],
        );
        employeeId = emp.rows[0].id;
      }

      await client.query(`delete from employee_brands where employee_id = $1`, [
        employeeId,
      ]);
      let sort = 0;
      for (const slug of demo.marques) {
        const brandId = brandBySlug[slug];
        if (!brandId) continue;
        await client.query(
          `insert into employee_brands (employee_id, brand_id, sort_order)
           values ($1, $2, $3)`,
          [employeeId, brandId, sort++],
        );
      }

      const cardExisting = await client.query(
        `select id from cards where organisation_id = $1 and employee_id = $2`,
        [organisationId, employeeId],
      );

      let cardId;
      if (cardExisting.rows[0]) {
        cardId = cardExisting.rows[0].id;
        await client.query(
          `update cards set
             slug = $2, public_status = 'draft', layout_id = 'modern',
             page_title = $3, meta_description = $4,
             primary_cta_label = 'WhatsApp', updated_at = now()
           where id = $1`,
          [
            cardId,
            demo.slug,
            demo.pageTitle,
            `${demo.display} · ${demo.title} (demo)`,
          ],
        );
      } else {
        const card = await client.query(
          `insert into cards (
             organisation_id, employee_id, slug, public_status, layout_id,
             page_title, meta_description, primary_cta_label
           ) values ($1, $2, $3, 'draft', 'modern', $4, $5, 'WhatsApp')
           returning id`,
          [
            organisationId,
            employeeId,
            demo.slug,
            demo.pageTitle,
            `${demo.display} · ${demo.title} (demo)`,
          ],
        );
        cardId = card.rows[0].id;
        const sectionTypes = ["hero", "contact_actions", "about"];
        for (let i = 0; i < sectionTypes.length; i++) {
          await client.query(
            `insert into card_sections (card_id, type, sort_order, enabled, config_json)
             values ($1, $2, $3, true, '{}'::jsonb)`,
            [cardId, sectionTypes[i], i],
          );
        }
      }

      created.push({
        key: demo.key,
        employeeId,
        cardId,
        slug: demo.slug,
        marques: demo.marques,
        photo: demo.photo,
        preview: `/dashboard/cards/${cardId}/preview`,
      });
    }

    // Also refresh the original AGG seed salesperson portrait when present.
    await client.query(
      `update employees
       set profile_photo_url = '/demos/portraits/thabo-molefe.jpg',
           updated_at = now()
       where organisation_id = $1
         and email = 'thabo.molefe@agg.co.za'
         and (profile_photo_url is null or profile_photo_url = '')`,
      [organisationId],
    );

    await client.query("commit");
    console.log(JSON.stringify({ ok: true, created }, null, 2));
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
