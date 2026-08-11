/**
 * Phases 10-12: live AGG <-> CMH tenant isolation verification.
 *
 * Uses real tenants + identities:
 *   A) Platform Admin  - shandon@devisionmedia.co.za
 *   B) AGG Org Admin   - crm@mail.com
 *   C) CMH Org Admin   - admin@example.cmh.local
 *
 * Usage:
 *   node scripts/create-cmh-admin-user.cjs   # once
 *   npm run test:isolation:cmh-agg
 */
const fs = require("fs");
const { Client } = require("pg");

function readEnv(key) {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

async function userIdByEmail(pg, email) {
  const { rows } = await pg.query(
    `select id from auth.users where email = $1 limit 1`,
    [email],
  );
  if (!rows[0]) throw new Error(`Auth user missing: ${email}`);
  return rows[0].id;
}

async function orgBySlug(pg, slug) {
  const { rows } = await pg.query(
    `select id, name, slug from public.organisations where slug = $1`,
    [slug],
  );
  if (!rows[0]) throw new Error(`Organisation missing: ${slug}`);
  return rows[0];
}

(async () => {
  const pass = readEnv("DATABASE_PASSWORD");
  const pg = await connect(pass);

  const results = [];
  const passTest = (name) => {
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  };
  const failTest = (name, err) => {
    results.push({ name, ok: false, err: String(err) });
    console.error(`FAIL  ${name}: ${err}`);
  };

  try {
    const platformId = await userIdByEmail(pg, "shandon@devisionmedia.co.za");
    const aggAdminId = await userIdByEmail(pg, "crm@mail.com");
    let cmhAdminId;
    try {
      cmhAdminId = await userIdByEmail(pg, "admin@example.cmh.local");
    } catch {
      throw new Error(
        "CMH admin missing - run: node scripts/create-cmh-admin-user.cjs",
      );
    }

    const agg = await orgBySlug(pg, "agg");
    const cmh = await orgBySlug(pg, "cmh-motor-group");

    const cmhEmployee = await pg.query(
      `select id from public.employees
       where organisation_id = $1 and employee_reference = 'demo-cmh-ford-ballito'
       limit 1`,
      [cmh.id],
    );
    const cmhCard = await pg.query(
      `select id, slug, public_status from public.cards
       where organisation_id = $1
       order by created_at desc limit 1`,
      [cmh.id],
    );
    const cmhBrand = await pg.query(
      `select id from public.brands where organisation_id = $1 and slug = 'ford'`,
      [cmh.id],
    );
    const cmhLocation = await pg.query(
      `select id from public.locations
       where organisation_id = $1 and slug = 'cmh-ford-ballito'`,
      [cmh.id],
    );
    const aggEmployee = await pg.query(
      `select id from public.employees where organisation_id = $1 limit 1`,
      [agg.id],
    );
    const aggBrand = await pg.query(
      `select id from public.brands where organisation_id = $1 limit 1`,
      [agg.id],
    );

    assert(cmhEmployee.rows[0], "CMH demo employee missing");
    assert(cmhCard.rows[0], "CMH demo card missing");
    assert(cmhBrand.rows[0], "Ford brand missing");
    assert(cmhLocation.rows[0], "Ballito location missing");
    assert(aggEmployee.rows[0], "AGG employee missing");
    assert(aggBrand.rows[0], "AGG brand missing");

    const cmhEmployeeId = cmhEmployee.rows[0].id;
    const cmhCardId = cmhCard.rows[0].id;
    const cmhBrandId = cmhBrand.rows[0].id;
    const cmhLocationId = cmhLocation.rows[0].id;
    const aggEmployeeId = aggEmployee.rows[0].id;
    const aggBrandId = aggBrand.rows[0].id;

    // ---- Phase 10: Platform Admin ------------------------------------------
    try {
      const profile = await pg.query(
        `select is_platform_admin, status from public.profiles where id = $1`,
        [platformId],
      );
      assert(profile.rows[0]?.is_platform_admin === true, "not platform admin");
      assert(profile.rows[0]?.status === "active", "platform admin inactive");

      await asUser(pg, platformId, async () => {
        const orgs = await pg.query(
          `select slug from public.organisations where slug in ('agg', 'cmh-motor-group') order by slug`,
        );
        assert(
          orgs.rows.map((r) => r.slug).join(",") === "agg,cmh-motor-group",
          `platform orgs = ${orgs.rows.map((r) => r.slug).join(",")}`,
        );

        const employees = await pg.query(
          `select id from public.employees where id in ($1, $2)`,
          [aggEmployeeId, cmhEmployeeId],
        );
        assert(employees.rows.length === 2, "platform should see both employees");

        const brands = await pg.query(
          `select id from public.brands where id in ($1, $2)`,
          [aggBrandId, cmhBrandId],
        );
        assert(brands.rows.length === 2, "platform should see both brands");

        const cards = await pg.query(
          `select id from public.cards where id = $1`,
          [cmhCardId],
        );
        assert(cards.rows.length === 1, "platform should see CMH draft card");
      });
      passTest("Phase 10: Platform Admin sees AGG + CMH tenants");
    } catch (e) {
      failTest("Phase 10: Platform Admin sees AGG + CMH tenants", e.message);
    }

    // Membership sanity for platform
    try {
      const mem = await pg.query(
        `select o.slug from public.memberships m
         join public.organisations o on o.id = m.organisation_id
         where m.user_id = $1 and o.slug in ('agg', 'cmh-motor-group')
         order by o.slug`,
        [platformId],
      );
      assert(
        mem.rows.some((r) => r.slug === "agg"),
        "platform missing AGG membership",
      );
      assert(
        mem.rows.some((r) => r.slug === "cmh-motor-group"),
        "platform missing CMH membership",
      );
      passTest("Phase 10: Platform Admin has memberships for both orgs");
    } catch (e) {
      failTest(
        "Phase 10: Platform Admin has memberships for both orgs",
        e.message,
      );
    }

    // ---- Phase 11: AGG admin -----------------------------------------------
    try {
      const profile = await pg.query(
        `select is_platform_admin from public.profiles where id = $1`,
        [aggAdminId],
      );
      assert(
        profile.rows[0]?.is_platform_admin === false,
        "AGG admin must not be platform admin",
      );

      await asUser(pg, aggAdminId, async () => {
        const orgs = await pg.query(`select slug, name from public.organisations`);
        assert(
          !orgs.rows.some((r) => r.slug === "cmh-motor-group"),
          "AGG admin can see CMH organisation",
        );
        assert(
          !orgs.rows.some((r) => /cmh/i.test(r.name)),
          "AGG admin can see CMH in organisation names",
        );
        assert(
          orgs.rows.some((r) => r.slug === "agg"),
          "AGG admin cannot see AGG",
        );

        const emp = await pg.query(
          `select id from public.employees where id = $1`,
          [cmhEmployeeId],
        );
        assert(emp.rows.length === 0, "AGG admin selected CMH employee");

        const brand = await pg.query(
          `select id, name from public.brands where id = $1`,
          [cmhBrandId],
        );
        assert(brand.rows.length === 0, "AGG admin selected Ford/CMH brand");

        const loc = await pg.query(
          `select id from public.locations where id = $1`,
          [cmhLocationId],
        );
        assert(loc.rows.length === 0, "AGG admin selected Ballito location");

        const card = await pg.query(
          `select id from public.cards where id = $1`,
          [cmhCardId],
        );
        assert(card.rows.length === 0, "AGG admin selected CMH card");

        const kits = await pg.query(
          `select id, name from public.brand_kits where organisation_id = $1`,
          [cmh.id],
        );
        assert(kits.rows.length === 0, "AGG admin selected CMH brand kits");

        const search = await pg.query(
          `select id, email, employee_reference from public.employees
           where id = $1
              or employee_reference = 'demo-cmh-ford-ballito'
              or lower(coalesce(email,'')) = lower($2)`,
          [cmhEmployeeId, "demo.jordan.naidoo@example.cmh.local"],
        );
        assert(search.rows.length === 0, "AGG admin search leaked CMH rows");

        // Mutations
        await pg.query("savepoint agg_mut");
        let updateDenied = false;
        try {
          const updated = await pg.query(
            `update public.cards set page_title = 'hacked' where id = $1 returning id`,
            [cmhCardId],
          );
          updateDenied = updated.rows.length === 0;
        } catch {
          updateDenied = true;
          await pg.query("rollback to savepoint agg_mut");
        }
        assert(updateDenied, "AGG admin updated CMH card");

        await pg.query("savepoint agg_ins");
        let insertDenied = false;
        try {
          await pg.query(
            `insert into public.employees
               (organisation_id, first_name, last_name, display_name, status)
             values ($1, 'Eve', 'Intruder', 'Eve Intruder', 'draft')`,
            [cmh.id],
          );
        } catch {
          insertDenied = true;
          await pg.query("rollback to savepoint agg_ins");
        }
        assert(insertDenied, "AGG admin inserted into CMH");

        await pg.query("savepoint agg_del");
        let deleteDenied = false;
        try {
          const deleted = await pg.query(
            `delete from public.locations where id = $1 returning id`,
            [cmhLocationId],
          );
          deleteDenied = deleted.rows.length === 0;
        } catch {
          deleteDenied = true;
          await pg.query("rollback to savepoint agg_del");
        }
        assert(deleteDenied, "AGG admin deleted CMH location");
      });
      passTest("Phase 11: AGG admin cannot access/mutate CMH data");
    } catch (e) {
      failTest("Phase 11: AGG admin cannot access/mutate CMH data", e.message);
    }

    // ---- Phase 12: CMH admin -----------------------------------------------
    try {
      const profile = await pg.query(
        `select is_platform_admin from public.profiles where id = $1`,
        [cmhAdminId],
      );
      assert(
        profile.rows[0]?.is_platform_admin === false,
        "CMH admin must not be platform admin",
      );

      const mem = await pg.query(
        `select o.slug from public.memberships m
         join public.organisations o on o.id = m.organisation_id
         where m.user_id = $1`,
        [cmhAdminId],
      );
      assert(
        mem.rows.every((r) => r.slug === "cmh-motor-group"),
        `CMH admin has unexpected memberships: ${mem.rows.map((r) => r.slug).join(",")}`,
      );

      await asUser(pg, cmhAdminId, async () => {
        const orgs = await pg.query(`select slug, name from public.organisations`);
        assert(
          !orgs.rows.some((r) => r.slug === "agg"),
          "CMH admin can see AGG organisation",
        );
        assert(
          !orgs.rows.some((r) => /agg/i.test(r.name)),
          "CMH admin can see AGG in organisation names",
        );
        assert(
          orgs.rows.some((r) => r.slug === "cmh-motor-group"),
          "CMH admin cannot see CMH",
        );
        assert(orgs.rows.length === 1, "CMH admin sees more than one org");

        const emp = await pg.query(
          `select id from public.employees where id = $1`,
          [aggEmployeeId],
        );
        assert(emp.rows.length === 0, "CMH admin selected AGG employee");

        const brand = await pg.query(
          `select id, slug from public.brands where id = $1`,
          [aggBrandId],
        );
        assert(brand.rows.length === 0, "CMH admin selected AGG brand");

        const geely = await pg.query(
          `select id from public.brands where slug in ('geely','jetour','mg','jac')`,
        );
        assert(geely.rows.length === 0, "CMH admin can see AGG marques");

        const search = await pg.query(
          `select id from public.employees
           where organisation_id = $1
              or lower(coalesce(display_name,'')) like '%thabo%'
              or lower(coalesce(email,'')) like '%agg%'`,
          [agg.id],
        );
        assert(search.rows.length === 0, "CMH admin search leaked AGG rows");

        // CMH admin CAN see own Ford/Ballito/demo
        const own = await pg.query(
          `select id from public.employees where id = $1`,
          [cmhEmployeeId],
        );
        assert(own.rows.length === 1, "CMH admin cannot see own demo employee");

        await pg.query("savepoint cmh_mut");
        let updateDenied = false;
        try {
          const updated = await pg.query(
            `update public.employees set job_title = 'Hacked' where id = $1 returning id`,
            [aggEmployeeId],
          );
          updateDenied = updated.rows.length === 0;
        } catch {
          updateDenied = true;
          await pg.query("rollback to savepoint cmh_mut");
        }
        assert(updateDenied, "CMH admin updated AGG employee");
      });
      passTest("Phase 12: CMH admin cannot access/mutate AGG data");
    } catch (e) {
      failTest("Phase 12: CMH admin cannot access/mutate AGG data", e.message);
    }

    // Draft public card must not resolve as active
    try {
      const resolved = await pg.query(
        `select public.resolve_public_card($1, $2) as payload`,
        ["cmh-motor-group", cmhCard.rows[0].slug],
      );
      const payload = resolved.rows[0]?.payload;
      assert(payload, "resolve_public_card returned null");
      assert(
        payload.type === "missing",
        `draft CMH card public type=${payload.type}`,
      );
      passTest("Draft CMH demo card is not publicly resolvable");
    } catch (e) {
      failTest("Draft CMH demo card is not publicly resolvable", e.message);
    }

    // Error-style safety: cross-tenant select returns empty (not CMH name leak)
    try {
      await asUser(pg, aggAdminId, async () => {
        const row = await pg.query(
          `select name from public.organisations where id = $1`,
          [cmh.id],
        );
        assert(row.rows.length === 0, "AGG admin got CMH org name via id");
      });
      passTest("Cross-tenant org id lookup returns empty (no name leak)");
    } catch (e) {
      failTest(
        "Cross-tenant org id lookup returns empty (no name leak)",
        e.message,
      );
    }
  } finally {
    await pg.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `CMH/AGG isolation: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length > 0) process.exit(1);
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
