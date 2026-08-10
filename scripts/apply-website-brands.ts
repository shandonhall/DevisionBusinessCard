/**
 * Apply website brand import to every brand (and org) that has a website.
 * Usage: node --import tsx scripts/apply-website-brands.ts
 *    or: npx tsx scripts/apply-website-brands.ts
 */
import { Client } from "pg";
import { readFileSync } from "fs";
import { extractBrandSuggestionFromHtml } from "../src/lib/branding/extract-from-website";

function readEnv(key: string) {
  const raw = readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing`);
  return line.slice(key.length + 1).trim();
}

async function fetchHtml(url: string): Promise<{ finalUrl: string; html: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "ConnectBrandImporter/1.0",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    const html = await response.text();
    return { finalUrl: response.url || url, html };
  } finally {
    clearTimeout(timer);
  }
}

function suggestionToKitUpdate(s: ReturnType<typeof extractBrandSuggestionFromHtml>) {
  return {
    primary_colour: s.primary,
    secondary_colour: s.secondary,
    accent_colour: s.accent,
    background_colour: s.background,
    surface_colour: s.surface,
    text_colour: s.text,
    muted_text_colour: s.mutedText,
    heading_font: s.headingFont,
    body_font: s.bodyFont,
    default_layout_id: s.layoutId,
    logo_url: s.logoUrl,
  };
}

async function main() {
  const pass = readEnv("DATABASE_PASSWORD");
  const ref = "gbattnbrqulqxlwhzaxx";
  const client = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const brands = await client.query<{
    id: string;
    name: string;
    website: string | null;
    brand_kit_id: string | null;
    organisation_id: string;
  }>(
    `select id, name, website, brand_kit_id, organisation_id
     from public.brands
     where website is not null and website <> ''`,
  );

  const orgs = await client.query<{
    id: string;
    name: string;
    website: string | null;
    default_brand_kit_id: string | null;
  }>(
    `select id, name, website, default_brand_kit_id
     from public.organisations
     where website is not null and website <> ''`,
  );

  console.log(
    `Brands with website: ${brands.rows.length}; orgs with website: ${orgs.rows.length}`,
  );

  for (const brand of brands.rows) {
    if (!brand.brand_kit_id || !brand.website) {
      console.log(`Skip brand ${brand.name}: missing kit or website`);
      continue;
    }
    process.stdout.write(`→ Brand "${brand.name}" (${brand.website}) … `);
    try {
      const { finalUrl, html } = await fetchHtml(brand.website);
      const suggestion = extractBrandSuggestionFromHtml(html, finalUrl);
      const update = suggestionToKitUpdate(suggestion);
      await client.query(
        `update public.brand_kits set
          primary_colour = $1,
          secondary_colour = $2,
          accent_colour = $3,
          background_colour = $4,
          surface_colour = $5,
          text_colour = $6,
          muted_text_colour = $7,
          heading_font = $8,
          body_font = $9,
          default_layout_id = $10,
          logo_url = coalesce($11, logo_url),
          updated_at = now()
         where id = $12`,
        [
          update.primary_colour,
          update.secondary_colour,
          update.accent_colour,
          update.background_colour,
          update.surface_colour,
          update.text_colour,
          update.muted_text_colour,
          update.heading_font,
          update.body_font,
          update.default_layout_id,
          update.logo_url,
          brand.brand_kit_id,
        ],
      );
      if (update.logo_url) {
        await client.query(
          `update public.brands set logo_url = coalesce(logo_url, $1), updated_at = now() where id = $2`,
          [update.logo_url, brand.id],
        );
      }
      console.log(`ok primary=${update.primary_colour} layout=${update.default_layout_id}`);
    } catch (error) {
      console.log("FAIL");
      console.error(error instanceof Error ? error.message : error);
    }
  }

  for (const org of orgs.rows) {
    if (!org.default_brand_kit_id || !org.website) continue;
    process.stdout.write(`→ Org "${org.name}" (${org.website}) … `);
    try {
      const { finalUrl, html } = await fetchHtml(org.website);
      const suggestion = extractBrandSuggestionFromHtml(html, finalUrl);
      const update = suggestionToKitUpdate(suggestion);
      await client.query(
        `update public.brand_kits set
          primary_colour = $1,
          secondary_colour = $2,
          accent_colour = $3,
          background_colour = $4,
          surface_colour = $5,
          text_colour = $6,
          muted_text_colour = $7,
          heading_font = $8,
          body_font = $9,
          default_layout_id = $10,
          logo_url = coalesce($11, logo_url),
          updated_at = now()
         where id = $12`,
        [
          update.primary_colour,
          update.secondary_colour,
          update.accent_colour,
          update.background_colour,
          update.surface_colour,
          update.text_colour,
          update.muted_text_colour,
          update.heading_font,
          update.body_font,
          update.default_layout_id,
          update.logo_url,
          org.default_brand_kit_id,
        ],
      );
      console.log(`ok primary=${update.primary_colour}`);
    } catch (error) {
      console.log("FAIL");
      console.error(error instanceof Error ? error.message : error);
    }
  }

  // If org has no website but a brand does, mirror the first brand kit onto the org default
  // so organisation-level preview stays in sync.
  for (const brand of brands.rows) {
    const org = await client.query(
      `select id, website, default_brand_kit_id from public.organisations where id = $1`,
      [brand.organisation_id],
    );
    const row = org.rows[0] as
      | { id: string; website: string | null; default_brand_kit_id: string | null }
      | undefined;
    if (!row?.default_brand_kit_id || row.website || !brand.brand_kit_id) continue;

    await client.query(
      `update public.organisations set website = $1, updated_at = now() where id = $2 and website is null`,
      [brand.website, row.id],
    );
    await client.query(
      `update public.brand_kits dest set
        primary_colour = src.primary_colour,
        secondary_colour = src.secondary_colour,
        accent_colour = src.accent_colour,
        background_colour = src.background_colour,
        surface_colour = src.surface_colour,
        text_colour = src.text_colour,
        muted_text_colour = src.muted_text_colour,
        heading_font = src.heading_font,
        body_font = src.body_font,
        default_layout_id = src.default_layout_id,
        logo_url = coalesce(src.logo_url, dest.logo_url),
        updated_at = now()
       from public.brand_kits src
       where src.id = $1 and dest.id = $2`,
      [brand.brand_kit_id, row.default_brand_kit_id],
    );
    console.log(
      `→ Mirrored brand "${brand.name}" kit onto org default + set org website`,
    );
  }

  await client.end();
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
