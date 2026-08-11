/**
 * Create (or attach) a CMH organisation admin for isolation testing.
 * CMH-only membership - never platform admin, never AGG.
 *
 * Usage: node scripts/create-cmh-admin-user.cjs
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
  fullName: "CMH Demo Admin",
  email: "admin@example.cmh.local",
  password: "CmhDemoAdmin123",
  orgSlug: "cmh-motor-group",
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
  const NEXT_PUBLIC_SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const DATABASE_PASSWORD = readEnv("DATABASE_PASSWORD");

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const pg = await connect(DATABASE_PASSWORD);
  await pg.query("begin");

  try {
    const org = await pg.query(
      `select id, slug from public.organisations where slug = $1 limit 1`,
      [INPUT.orgSlug],
    );
    if (!org.rows[0]) {
      throw new Error(`Organisation '${INPUT.orgSlug}' not found`);
    }
    const organisationId = org.rows[0].id;

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
        user_metadata: { full_name: INPUT.fullName },
      });
      if (error) throw new Error(`createUser failed: ${error.message}`);
      userId = data.user.id;
    }

    await pg.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin')
       on conflict (user_id, organisation_id) do update
       set role = 'organisation_admin'`,
      [userId, organisationId],
    );

    // Ensure NOT platform admin (service_role JWT required by Phase 2 trigger)
    await pg.query(
      `select set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ role: "service_role" })],
    );
    await pg.query(
      `select set_config('request.jwt.claim.role', 'service_role', true)`,
    );
    await pg.query(
      `update public.profiles
       set full_name = $1,
           status = 'active',
           is_platform_admin = false
       where id = $2`,
      [INPUT.fullName, userId],
    );

    // Remove any accidental AGG membership for this CMH-only test user
    await pg.query(
      `delete from public.memberships m
       using public.organisations o
       where m.organisation_id = o.id
         and m.user_id = $1
         and o.slug = 'agg'`,
      [userId],
    );

    await pg.query("commit");
    console.log("CREATED/ATTACHED CMH ORG ADMIN", {
      email: INPUT.email,
      password: INPUT.password,
      fullName: INPUT.fullName,
      orgSlug: INPUT.orgSlug,
      organisationId,
      userId,
      note: "CMH-only. Not platform admin. Not AGG.",
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
