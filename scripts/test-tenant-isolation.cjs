/**
 * Live RLS tenant-isolation suite (Phase 3).
 *
 * Creates ephemeral Org A / Org B (+ users, brands, locations, employees, cards),
 * asserts cross-tenant deny / same-tenant allow / Platform Admin allow,
 * then cleans up.
 *
 * Usage:
 *   npm run test:isolation
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_PASSWORD
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function asUser(pg, userId, fn) {
  await pg.query("begin");
  try {
    const claims = JSON.stringify({
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
    });
    await pg.query(`select set_config('request.jwt.claims', $1, true)`, [
      claims,
    ]);
    await pg.query(`select set_config('request.jwt.claim.sub', $1, true)`, [
      userId,
    ]);
    await pg.query(
      `select set_config('request.jwt.claim.role', 'authenticated', true)`,
    );
    await pg.query(`set local role authenticated`);
    return await fn();
  } finally {
    await pg.query("rollback");
  }
}

async function createAuthUser(supabase, email, password, fullName) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

async function deleteAuthUser(supabase, userId) {
  if (!userId) return;
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`cleanup user ${userId}: ${error.message}`);
  }
}

(async () => {
  const NEXT_PUBLIC_SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const DATABASE_PASSWORD = readEnv("DATABASE_PASSWORD");
  const ref = "gbattnbrqulqxlwhzaxx";

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const pg = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(
      DATABASE_PASSWORD,
    )}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });

  const stamp = Date.now().toString(36);
  const slugA = `iso-a-${stamp}`;
  const slugB = `iso-b-${stamp}`;
  const password = `IsoTest-${stamp}-Aa1`;

  let userA = null;
  let userB = null;
  let userPlatform = null;
  let orgA = null;
  let orgB = null;
  let brandA = null;
  let brandB = null;
  let locationA = null;
  let locationB = null;
  let employeeA = null;
  let employeeB = null;
  let cardA = null;
  let cardB = null;

  const results = [];

  function pass(name) {
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  }

  function fail(name, err) {
    results.push({ name, ok: false, err: String(err) });
    console.error(`FAIL  ${name}: ${err}`);
  }

  await pg.connect();

  try {
    userA = await createAuthUser(
      supabase,
      `iso-a-${stamp}@example.com`,
      password,
      "Isolation Admin A",
    );
    userB = await createAuthUser(
      supabase,
      `iso-b-${stamp}@example.com`,
      password,
      "Isolation Admin B",
    );
    userPlatform = await createAuthUser(
      supabase,
      `iso-platform-${stamp}@example.com`,
      password,
      "Isolation Platform Admin",
    );

    // Seed tenant graph as postgres (bypasses RLS)
    const orgARes = await pg.query(
      `insert into public.organisations (name, slug, status)
       values ($1, $2, 'active') returning id`,
      [`Isolation Org A ${stamp}`, slugA],
    );
    orgA = orgARes.rows[0].id;

    const orgBRes = await pg.query(
      `insert into public.organisations (name, slug, status)
       values ($1, $2, 'active') returning id`,
      [`Isolation Org B ${stamp}`, slugB],
    );
    orgB = orgBRes.rows[0].id;

    await pg.query(
      `insert into public.memberships (user_id, organisation_id, role)
       values ($1, $2, 'organisation_admin'), ($3, $4, 'organisation_admin')`,
      [userA, orgA, userB, orgB],
    );

    // Platform admin flag requires service_role JWT (Phase 2 trigger)
    await pg.query("begin");
    await pg.query(
      `select set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ role: "service_role" })],
    );
    await pg.query(
      `select set_config('request.jwt.claim.role', 'service_role', true)`,
    );
    await pg.query(
      `update public.profiles set is_platform_admin = true where id = $1`,
      [userPlatform],
    );
    await pg.query("commit");

    const brandARes = await pg.query(
      `insert into public.brands (organisation_id, name, slug)
       values ($1, 'Brand A', 'brand-a') returning id`,
      [orgA],
    );
    brandA = brandARes.rows[0].id;

    const brandBRes = await pg.query(
      `insert into public.brands (organisation_id, name, slug)
       values ($1, 'Brand B', 'brand-b') returning id`,
      [orgB],
    );
    brandB = brandBRes.rows[0].id;

    const locARes = await pg.query(
      `insert into public.locations (organisation_id, brand_id, name, slug, type)
       values ($1, $2, 'Location A', 'location-a', 'branch') returning id`,
      [orgA, brandA],
    );
    locationA = locARes.rows[0].id;

    const locBRes = await pg.query(
      `insert into public.locations (organisation_id, brand_id, name, slug, type)
       values ($1, $2, 'Location B', 'location-b', 'branch') returning id`,
      [orgB, brandB],
    );
    locationB = locBRes.rows[0].id;

    const empARes = await pg.query(
      `insert into public.employees
         (organisation_id, brand_id, location_id, first_name, last_name, display_name, email, status)
       values ($1, $2, $3, 'Ada', 'Alpha', 'Ada Alpha', $4, 'draft')
       returning id`,
      [orgA, brandA, locationA, `ada-a-${stamp}@example.com`],
    );
    employeeA = empARes.rows[0].id;

    const empBRes = await pg.query(
      `insert into public.employees
         (organisation_id, brand_id, location_id, first_name, last_name, display_name, email, status)
       values ($1, $2, $3, 'Bea', 'Beta', 'Bea Beta', $4, 'draft')
       returning id`,
      [orgB, brandB, locationB, `bea-b-${stamp}@example.com`],
    );
    employeeB = empBRes.rows[0].id;

    const cardARes = await pg.query(
      `insert into public.cards
         (organisation_id, employee_id, slug, public_status, layout_id)
       values ($1, $2, 'ada-alpha', 'draft', 'modern')
       returning id`,
      [orgA, employeeA],
    );
    cardA = cardARes.rows[0].id;

    const cardBRes = await pg.query(
      `insert into public.cards
         (organisation_id, employee_id, slug, public_status, layout_id)
       values ($1, $2, 'bea-beta', 'draft', 'modern')
       returning id`,
      [orgB, employeeB],
    );
    cardB = cardBRes.rows[0].id;

    // ---- Isolation assertions ------------------------------------------------

    try {
      await asUser(pg, userA, async () => {
        const orgs = await pg.query(`select id, slug from public.organisations`);
        assert(
          orgs.rows.every((r) => r.id === orgA),
          `Org A admin saw unexpected orgs: ${orgs.rows.map((r) => r.slug).join(",")}`,
        );
        assert(orgs.rows.length === 1, "Org A admin should see exactly 1 org");
      });
      pass("Org A admin SELECT organisations is membership-scoped");
    } catch (e) {
      fail("Org A admin SELECT organisations is membership-scoped", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        const employees = await pg.query(
          `select id from public.employees where id = $1`,
          [employeeB],
        );
        assert(employees.rows.length === 0, "Org A admin selected Org B employee");
      });
      pass("Org A admin SELECT Org B employee → empty");
    } catch (e) {
      fail("Org A admin SELECT Org B employee → empty", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        const updated = await pg.query(
          `update public.cards set page_title = 'hacked' where id = $1 returning id`,
          [cardB],
        );
        assert(updated.rows.length === 0, "Org A admin updated Org B card");
      });
      pass("Org A admin UPDATE Org B card → denied/empty");
    } catch (e) {
      fail("Org A admin UPDATE Org B card → denied/empty", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        await pg.query("savepoint before_cross_tenant_insert");
        let denied = false;
        try {
          await pg.query(
            `insert into public.employees
               (organisation_id, first_name, last_name, display_name, status)
             values ($1, 'Eve', 'Intruder', 'Eve Intruder', 'draft')`,
            [orgB],
          );
        } catch {
          denied = true;
          await pg.query("rollback to savepoint before_cross_tenant_insert");
        }
        assert(denied, "Org A admin inserted employee into Org B");
      });
      pass("Org A admin INSERT employee into Org B → denied");
    } catch (e) {
      fail("Org A admin INSERT employee into Org B → denied", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        const deleted = await pg.query(
          `delete from public.locations where id = $1 returning id`,
          [locationB],
        );
        assert(deleted.rows.length === 0, "Org A admin deleted Org B location");
      });
      pass("Org A admin DELETE Org B location → denied/empty");
    } catch (e) {
      fail("Org A admin DELETE Org B location → denied/empty", e.message);
    }

    try {
      await asUser(pg, userB, async () => {
        const employees = await pg.query(
          `select id from public.employees where id = $1`,
          [employeeA],
        );
        assert(employees.rows.length === 0, "Org B admin selected Org A employee");

        const brands = await pg.query(
          `select id from public.brands where id = $1`,
          [brandA],
        );
        assert(brands.rows.length === 0, "Org B admin selected Org A brand");
      });
      pass("Org B admin cannot SELECT Org A employees/brands");
    } catch (e) {
      fail("Org B admin cannot SELECT Org A employees/brands", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        await pg.query("savepoint before_cross_brand");
        let denied = false;
        try {
          await pg.query(
            `insert into public.location_brands (location_id, brand_id)
             values ($1, $2)`,
            [locationA, brandB],
          );
        } catch {
          denied = true;
          await pg.query("rollback to savepoint before_cross_brand");
        }
        assert(denied, "Cross-tenant location_brands insert succeeded");
      });
      pass("Cross-tenant location_brands INSERT → denied");
    } catch (e) {
      fail("Cross-tenant location_brands INSERT → denied", e.message);
    }

    try {
      await asUser(pg, userA, async () => {
        await pg.query("savepoint before_privilege_escalation");
        let denied = false;
        try {
          await pg.query(
            `update public.profiles set is_platform_admin = true where id = $1`,
            [userA],
          );
        } catch {
          denied = true;
          await pg.query("rollback to savepoint before_privilege_escalation");
        }

        assert(denied, "Org A admin self-elevated to platform admin");

        const check = await pg.query(
          `select is_platform_admin from public.profiles where id = $1`,
          [userA],
        );
        assert(
          check.rows[0]?.is_platform_admin === false,
          "is_platform_admin became true",
        );
      });
      pass("Authenticated user cannot self-grant is_platform_admin");
    } catch (e) {
      fail("Authenticated user cannot self-grant is_platform_admin", e.message);
    }

    try {
      await asUser(pg, userPlatform, async () => {
        const orgs = await pg.query(
          `select id from public.organisations where id in ($1, $2)`,
          [orgA, orgB],
        );
        assert(orgs.rows.length === 2, "Platform admin should see both test orgs");

        const employees = await pg.query(
          `select id from public.employees where id in ($1, $2)`,
          [employeeA, employeeB],
        );
        assert(
          employees.rows.length === 2,
          "Platform admin should see both employees",
        );
      });
      pass("Platform Admin can SELECT both organisations and employees");
    } catch (e) {
      fail(
        "Platform Admin can SELECT both organisations and employees",
        e.message,
      );
    }

    try {
      await asUser(pg, userA, async () => {
        // Knowing Org B IDs must not grant visibility
        const byBrand = await pg.query(
          `select id from public.employees where brand_id = $1`,
          [brandB],
        );
        const byLocation = await pg.query(
          `select id from public.employees where location_id = $1`,
          [locationB],
        );
        const byCard = await pg.query(
          `select id from public.cards where id = $1`,
          [cardB],
        );
        assert(byBrand.rows.length === 0, "Indirect brand_id leak");
        assert(byLocation.rows.length === 0, "Indirect location_id leak");
        assert(byCard.rows.length === 0, "Indirect card_id leak");
      });
      pass("Indirect ID lookups do not leak cross-tenant rows");
    } catch (e) {
      fail("Indirect ID lookups do not leak cross-tenant rows", e.message);
    }

    try {
      // Org A admin may update own-tenant employee fields
      await asUser(pg, userA, async () => {
        const updated = await pg.query(
          `update public.employees
             set job_title = 'Sales Executive'
           where id = $1
           returning id`,
          [employeeA],
        );
        assert(updated.rows.length === 1, "Same-tenant employee update failed");
      });
      pass("Org A admin UPDATE own employee → allowed");
    } catch (e) {
      fail("Org A admin UPDATE own employee → allowed", e.message);
    }
  } finally {
    // Cleanup test graph (postgres bypasses RLS)
    try {
      if (orgA) {
        await pg.query(`delete from public.organisations where id = $1`, [orgA]);
      }
      if (orgB) {
        await pg.query(`delete from public.organisations where id = $1`, [orgB]);
      }
    } catch (e) {
      console.warn("org cleanup:", e.message);
    }

    await deleteAuthUser(supabase, userA);
    await deleteAuthUser(supabase, userB);
    await deleteAuthUser(supabase, userPlatform);

    await pg.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `Isolation results: ${results.length - failed.length}/${results.length} passed`,
  );

  if (failed.length > 0) {
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
