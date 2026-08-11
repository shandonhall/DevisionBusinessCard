/**
 * Phases 7-8: Refine CMH Ford Brand DNA + seed fictional DRAFT demo card.
 *
 * Demo employee: Jordan Naidoo (fictional) at CMH Ford Ballito.
 * Card status: draft (not publicly discoverable).
 *
 * Idempotent on employee_reference = demo-cmh-ford-ballito
 * Does not modify AGG.
 *
 * Usage: node scripts/seed-cmh-ford-demo.cjs
 */
const { Client } = require("pg");
const fs = require("fs");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const ORG_SLUG = "cmh-motor-group";
const BRAND_SLUG = "ford";
const LOCATION_SLUG = "cmh-ford-ballito";

const DEMO = {
  key: "demo-cmh-ford-ballito",
  first: "Jordan",
  last: "Naidoo",
  display: "Jordan Naidoo",
  title: "Sales Executive",
  dept: "Sales",
  email: "demo.jordan.naidoo@example.cmh.local",
  mobile: "+27820002001",
  whatsapp: "+27820002001",
  slug: "demo-jordan-naidoo",
  pageTitle: "Demo · CMH Ford Ballito",
  // Reuse stock portrait asset if present; otherwise null.
  photo: fs.existsSync("public/demos/portraits/jordan-naidoo.jpg")
    ? "/demos/portraits/jordan-naidoo.jpg"
    : null,
};

const FORD_DNA = {
  primary_colour: "#003478",
  secondary_colour: "#001E44",
  accent_colour: "#5B9BD5",
  background_colour: "#04070C",
  surface_colour: "#0C121A",
  text_colour: "#F4F7FB",
  muted_text_colour: "#8FA3B8",
  heading_font: "Montserrat",
  body_font: "Source Sans 3",
  button_radius: "4px",
  card_radius: "12px",
  border_style: "subtle",
  shadow_style: "soft",
  background_style: "solid",
  logo_url: "/brands/marques/ford-logo.png",
  default_layout_id: "modern",
  experience_preset: "drive",
  experience_config: {
    brandPreset: "ford",
    tiltStrength: 0.47,
    reflectionStrength: 0.7,
    chromaticIntensity: 0.16,
    interactionIntensity: 0.58,
    environmentTone: "studio-dark",
    ambientMotion: true,
    sourceUrl: "https://cmhford.co.za/ballito/",
    logoSource: "https://cmhford.co.za/wp-content/uploads/2022/09/ford_logo.png",
    fontNote:
      "Ford Fuse not redistributed; Montserrat + Source Sans 3 approximate Ford industrial sans.",
  },
};

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
  const client = await connect(pass);
  await client.query("begin");

  try {
    const org = await client.query(
      `select id from public.organisations where slug = $1`,
      [ORG_SLUG],
    );
    if (!org.rows[0]) throw new Error("CMH org missing - run seed:cmh-org");
    const organisationId = org.rows[0].id;

    const brand = await client.query(
      `select id, brand_kit_id from public.brands
       where organisation_id = $1 and slug = $2`,
      [organisationId, BRAND_SLUG],
    );
    if (!brand.rows[0]) {
      throw new Error("Ford brand missing - run seed:cmh-ford-brand");
    }
    const brandId = brand.rows[0].id;
    let brandKitId = brand.rows[0].brand_kit_id;

    const location = await client.query(
      `select id from public.locations
       where organisation_id = $1 and slug = $2`,
      [organisationId, LOCATION_SLUG],
    );
    if (!location.rows[0]) {
      throw new Error("Ballito location missing - run seed:cmh-ford-ballito");
    }
    const locationId = location.rows[0].id;

    // ---- Phase 7: refine Ford brand kit DNA ---------------------------------
    if (brandKitId) {
      await client.query(
        `update public.brand_kits set
           name = 'Ford Drive',
           primary_colour = $2,
           secondary_colour = $3,
           accent_colour = $4,
           background_colour = $5,
           surface_colour = $6,
           text_colour = $7,
           muted_text_colour = $8,
           heading_font = $9,
           body_font = $10,
           button_radius = $11,
           card_radius = $12,
           border_style = $13,
           shadow_style = $14,
           background_style = $15,
           logo_url = $16,
           default_layout_id = $17,
           experience_preset = $18,
           experience_config = $19::jsonb,
           brand_id = $20,
           updated_at = now()
         where id = $1 and organisation_id = $21`,
        [
          brandKitId,
          FORD_DNA.primary_colour,
          FORD_DNA.secondary_colour,
          FORD_DNA.accent_colour,
          FORD_DNA.background_colour,
          FORD_DNA.surface_colour,
          FORD_DNA.text_colour,
          FORD_DNA.muted_text_colour,
          FORD_DNA.heading_font,
          FORD_DNA.body_font,
          FORD_DNA.button_radius,
          FORD_DNA.card_radius,
          FORD_DNA.border_style,
          FORD_DNA.shadow_style,
          FORD_DNA.background_style,
          FORD_DNA.logo_url,
          FORD_DNA.default_layout_id,
          FORD_DNA.experience_preset,
          JSON.stringify(FORD_DNA.experience_config),
          brandId,
          organisationId,
        ],
      );
    } else {
      const kit = await client.query(
        `insert into public.brand_kits (
           organisation_id, brand_id, name,
           primary_colour, secondary_colour, accent_colour,
           background_colour, surface_colour, text_colour, muted_text_colour,
           heading_font, body_font, button_radius, card_radius,
           border_style, shadow_style, background_style, logo_url,
           default_layout_id, experience_preset, experience_config
         ) values (
           $1, $2, 'Ford Drive',
           $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
           $18, $19, $20::jsonb
         ) returning id`,
        [
          organisationId,
          brandId,
          FORD_DNA.primary_colour,
          FORD_DNA.secondary_colour,
          FORD_DNA.accent_colour,
          FORD_DNA.background_colour,
          FORD_DNA.surface_colour,
          FORD_DNA.text_colour,
          FORD_DNA.muted_text_colour,
          FORD_DNA.heading_font,
          FORD_DNA.body_font,
          FORD_DNA.button_radius,
          FORD_DNA.card_radius,
          FORD_DNA.border_style,
          FORD_DNA.shadow_style,
          FORD_DNA.background_style,
          FORD_DNA.logo_url,
          FORD_DNA.default_layout_id,
          FORD_DNA.experience_preset,
          JSON.stringify(FORD_DNA.experience_config),
        ],
      );
      brandKitId = kit.rows[0].id;
      await client.query(
        `update public.brands set brand_kit_id = $1 where id = $2`,
        [brandKitId, brandId],
      );
    }

    // Also keep org default kit Ford-neutral but not AGG gold
    await client.query(
      `update public.brand_kits bk
       set experience_preset = 'drive',
           primary_colour = '#1B1B1B',
           secondary_colour = '#333333',
           accent_colour = '#003478',
           updated_at = now()
       from public.organisations o
       where o.id = $1
         and bk.id = o.default_brand_kit_id
         and bk.organisation_id = $1`,
      [organisationId],
    );

    // ---- Phase 8: fictional DRAFT demo employee + card ----------------------
    const existingEmp = await client.query(
      `select id from public.employees
       where organisation_id = $1 and employee_reference = $2`,
      [organisationId, DEMO.key],
    );

    let employeeId;
    const bio =
      "DEMO record - fictional salesperson for CMH Ford Ballito pitch preview. Not a real CMH employee.";

    if (existingEmp.rows[0]) {
      employeeId = existingEmp.rows[0].id;
      await client.query(
        `update public.employees set
           first_name = $2, last_name = $3, display_name = $4,
           job_title = $5, department = $6, email = $7,
           mobile = $8, whatsapp = $9,
           brand_id = $10, location_id = $11, status = 'draft',
           bio = $12, profile_photo_url = $13, updated_at = now()
         where id = $1`,
        [
          employeeId,
          DEMO.first,
          DEMO.last,
          DEMO.display,
          DEMO.title,
          DEMO.dept,
          DEMO.email,
          DEMO.mobile,
          DEMO.whatsapp,
          brandId,
          locationId,
          bio,
          DEMO.photo,
        ],
      );
    } else {
      const emp = await client.query(
        `insert into public.employees (
           organisation_id, brand_id, location_id,
           first_name, last_name, display_name, job_title, department,
           email, mobile, whatsapp, bio, status, employee_reference,
           profile_photo_url
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13, $14
         ) returning id`,
        [
          organisationId,
          brandId,
          locationId,
          DEMO.first,
          DEMO.last,
          DEMO.display,
          DEMO.title,
          DEMO.dept,
          DEMO.email,
          DEMO.mobile,
          DEMO.whatsapp,
          bio,
          DEMO.key,
          DEMO.photo,
        ],
      );
      employeeId = emp.rows[0].id;
    }

    await client.query(`delete from public.employee_brands where employee_id = $1`, [
      employeeId,
    ]);
    await client.query(
      `insert into public.employee_brands (employee_id, brand_id, sort_order)
       values ($1, $2, 0)`,
      [employeeId, brandId],
    );

    const cardExisting = await client.query(
      `select id from public.cards where organisation_id = $1 and employee_id = $2`,
      [organisationId, employeeId],
    );

    let cardId;
    if (cardExisting.rows[0]) {
      cardId = cardExisting.rows[0].id;
      await client.query(
        `update public.cards set
           slug = $2,
           public_status = 'draft',
           layout_id = 'modern',
           page_title = $3,
           meta_description = $4,
           primary_cta_label = 'Save Contact',
           published_at = null,
           updated_at = now()
         where id = $1`,
        [
          cardId,
          DEMO.slug,
          DEMO.pageTitle,
          `${DEMO.display} · ${DEMO.title} at CMH Ford Ballito (demo)`,
        ],
      );
    } else {
      const card = await client.query(
        `insert into public.cards (
           organisation_id, employee_id, slug, public_status, layout_id,
           page_title, meta_description, primary_cta_label
         ) values ($1, $2, $3, 'draft', 'modern', $4, $5, 'Save Contact')
         returning id`,
        [
          organisationId,
          employeeId,
          DEMO.slug,
          DEMO.pageTitle,
          `${DEMO.display} · ${DEMO.title} at CMH Ford Ballito (demo)`,
        ],
      );
      cardId = card.rows[0].id;
      const sectionTypes = ["hero", "contact_actions", "about"];
      for (let i = 0; i < sectionTypes.length; i++) {
        await client.query(
          `insert into public.card_sections (card_id, type, sort_order, enabled, config_json)
           values ($1, $2, $3, true, '{}'::jsonb)`,
          [cardId, sectionTypes[i], i],
        );
      }
    }

    // Isolation: AGG must not have this employee reference / slug collision as CMH data
    const aggLeak = await client.query(
      `select e.id
       from public.employees e
       join public.organisations o on o.id = e.organisation_id
       where o.slug = 'agg' and e.employee_reference = $1`,
      [DEMO.key],
    );
    if (aggLeak.rows.length > 0) {
      throw new Error("CMH demo employee unexpectedly linked under AGG");
    }

    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          ok: true,
          phase7: { brandKitId, brandPreset: "ford" },
          phase8: {
            employeeId,
            cardId,
            slug: DEMO.slug,
            publicStatus: "draft",
            publicPathWouldBe: `/${ORG_SLUG}/${DEMO.slug}`,
            publicAccess: "denied while draft",
            adminPreview: `/dashboard/cards/${cardId}/preview`,
            photo: DEMO.photo,
          },
          next: "Phase 9 - refine Ford Drive visual experience if needed",
        },
        null,
        2,
      ),
    );
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
