/**
 * Create (or attach) an AGG organisation admin user.
 *
 * - Creates a Supabase auth user for `crm@mail.com` (if missing)
 * - Sets profile `full_name` from user_metadata.full_name
 * - Upserts membership into `public.memberships` for org slug `agg`
 *
 * Usage:
 *   node scripts/create-agg-admin-user.cjs
 *
 * Note: This uses the locally configured SUPABASE_SERVICE_ROLE_KEY.
 */
const fs = require("fs");
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const INPUT = {
  fullName: "Cameryn Joseph",
  email: "crm@mail.com",
  password: "Password123",
  orgSlug: "agg",
};

(async () => {
  const NEXT_PUBLIC_SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const DATABASE_PASSWORD = readEnv("DATABASE_PASSWORD");

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const ref = "gbattnbrqulqxlwhzaxx";
  const pg = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(
      DATABASE_PASSWORD,
    )}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });

  await pg.connect();

  try {
    await pg.query("begin");

    const org = await pg.query(
      `select id, slug from public.organisations where slug = $1 limit 1`,
      [INPUT.orgSlug],
    );
    if (org.rows.length === 0) {
      throw new Error(`Organisation slug '${INPUT.orgSlug}' not found`);
    }
    const organisationId = org.rows[0].id;

    // Try to find auth user first (avoids double-create)
    const existingUser = await pg.query(
      `select id from auth.users where email = $1 limit 1`,
      [INPUT.email],
    );

    let userId = existingUser.rows[0]?.id;

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: INPUT.email,
        password: INPUT.password,
        email_confirm: true,
        user_metadata: {
          full_name: INPUT.fullName,
          // These are used by the app's onboarding flow; harmless here.
          organisation_name: "AGG Motors",
          organisation_slug: INPUT.orgSlug,
        },
      });

      if (error) {
        throw new Error(`Failed to create auth user: ${error.message}`);
      }

      userId = data.user.id;
    }

    // Ensure membership exists for this tenant
    await pg.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin')
       on conflict (user_id, organisation_id) do update
       set role = 'organisation_admin'`,
      [userId, organisationId],
    );

    // Ensure full_name is populated on the profile (trigger normally does this,
    // but updating is idempotent and helpful if metadata changed).
    await pg.query(
      `update public.profiles
       set full_name = $1, status = 'active'
       where id = $2`,
      [INPUT.fullName, userId],
    );

    await pg.query("commit");

    console.log("CREATED/ATTACHED AGG ORG ADMIN", {
      email: INPUT.email,
      fullName: INPUT.fullName,
      orgSlug: INPUT.orgSlug,
      organisationId,
      userId,
    });
  } catch (e) {
    await pg.query("rollback");
    throw e;
  } finally {
    await pg.end();
  }
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

