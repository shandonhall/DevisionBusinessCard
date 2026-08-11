/**
 * Verify AGG admin membership for a given email.
 * Intended for quick manual confirmation after bootstrap scripts.
 */
const fs = require("fs");
const { Client } = require("pg");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

const INPUT = {
  email: "crm@mail.com",
  orgSlug: "agg",
};

(async () => {
  const DATABASE_PASSWORD = readEnv("DATABASE_PASSWORD");

  const client = new Client({
    connectionString: `postgresql://postgres.gbattnbrqulqxlwhzaxx:${encodeURIComponent(
      DATABASE_PASSWORD,
    )}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const user = await client.query(
      `select id, email from auth.users where email = $1 limit 1`,
      [INPUT.email],
    );
    const userId = user.rows[0]?.id;
    if (!userId) throw new Error(`Auth user not found for ${INPUT.email}`);

    const memberships = await client.query(
      `select o.name, o.slug, m.role
       from public.memberships m
       join public.organisations o on o.id = m.organisation_id
       where m.user_id = $1
       order by o.name`,
      [userId],
    );

    const aggMembership = memberships.rows.find((r) => r.slug === INPUT.orgSlug);

    const profile = await client.query(
      `select id, email, full_name, is_platform_admin, status
       from public.profiles where id = $1`,
      [userId],
    );

    console.log(
      JSON.stringify(
        {
          user: user.rows[0],
          profile: profile.rows[0],
          memberships: memberships.rows,
          aggMembership,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

