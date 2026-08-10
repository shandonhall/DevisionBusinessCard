import "server-only";

import { createClient } from "@/lib/supabase/server";
import { slugifyOrganisationName } from "@/lib/validation/auth";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";
import type {
  Card,
  CardLayoutId,
  CardPublicStatus,
  Database,
  Employee,
} from "@/types/database";
import { DEFAULT_CARD_SECTION_ORDER } from "@/types/card";
import {
  parsePublicCardPayload,
  toPublicCardViewModel,
} from "@/lib/cards/public-card";
import {
  parsePublicCardResolution,
  type PublicCardResolution,
} from "@/lib/cards/resolve-public";
import type { PublicCardViewModel } from "@/types/card";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function resolvePublicCardRequest(
  organisationSlug: string,
  cardSlug: string,
): Promise<PublicCardResolution> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_public_card", {
    org_slug: organisationSlug,
    card_slug: cardSlug,
  });

  if (error) {
    throw new Error(error.message);
  }

  return parsePublicCardResolution(data);
}

/** @deprecated Prefer resolvePublicCardRequest for publishing states. */
export async function getPublicCardViewModel(
  organisationSlug: string,
  cardSlug: string,
): Promise<PublicCardViewModel | null> {
  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);
  return resolved.type === "active" ? resolved.view : null;
}

export async function getCardPreviewForAdmin(params: {
  organisationId: string;
  cardId: string;
}): Promise<PublicCardViewModel | null> {
  const supabase = await createClient();
  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", params.cardId)
    .eq("organisation_id", params.organisationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!card) return null;

  const { data: organisation } = await supabase
    .from("organisations")
    .select("slug")
    .eq("id", params.organisationId)
    .maybeSingle();

  if (!organisation) return null;

  // Preview uses the public assembler when active; otherwise assemble via admin reads.
  if (card.public_status === "active") {
    return getPublicCardViewModel(organisation.slug, card.slug);
  }

  const [{ data: employee }, { data: orgFull }, { data: sections }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("id", card.employee_id)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("*")
        .eq("id", params.organisationId)
        .maybeSingle(),
      supabase
        .from("card_sections")
        .select("*")
        .eq("card_id", card.id)
        .eq("enabled", true)
        .order("sort_order", { ascending: true }),
    ]);

  if (!employee || !orgFull) return null;

  const [{ data: brand }, { data: location }, { data: orgKit }] =
    await Promise.all([
      employee.brand_id
        ? supabase
            .from("brands")
            .select("*")
            .eq("id", employee.brand_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      employee.location_id
        ? supabase
            .from("locations")
            .select("*")
            .eq("id", employee.location_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      orgFull.default_brand_kit_id
        ? supabase
            .from("brand_kits")
            .select("*")
            .eq("id", orgFull.default_brand_kit_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  let brandKit = null;
  if (brand?.brand_kit_id) {
    const { data } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("id", brand.brand_kit_id)
      .maybeSingle();
    brandKit = data;
  }

  const payload = parsePublicCardPayload({
    card: {
      id: card.id,
      slug: card.slug,
      layout_id: card.layout_id,
      page_title: card.page_title,
      meta_description: card.meta_description,
      primary_cta_label: card.primary_cta_label,
      primary_cta_url: card.primary_cta_url,
      public_status: card.public_status,
    },
    organisation: {
      id: orgFull.id,
      name: orgFull.name,
      slug: orgFull.slug,
      website: orgFull.website,
      white_label_enabled: orgFull.white_label_enabled,
    },
    employee: {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      display_name: employee.display_name,
      job_title: employee.job_title,
      department: employee.department,
      email: employee.email,
      mobile: employee.mobile,
      whatsapp: employee.whatsapp,
      linkedin_url: employee.linkedin_url,
      profile_photo_url: employee.profile_photo_url,
      bio: employee.bio,
    },
    brand: brand
      ? {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          website: brand.website,
          logo_url: brand.logo_url,
        }
      : null,
    location: location
      ? {
          id: location.id,
          name: location.name,
          slug: location.slug,
          type: location.type,
          address: location.address,
          phone: location.phone,
          email: location.email,
          website: location.website,
        }
      : null,
    organisation_kit: orgKit,
    brand_kit: brandKit,
    card_kit: null,
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      type: section.type,
      sort_order: section.sort_order,
      enabled: section.enabled,
      config_json: section.config_json,
    })),
  });

  return payload ? toPublicCardViewModel(payload) : null;
}

export async function listCards(
  organisationId: string,
  options?: { includeArchived?: boolean },
): Promise<
  (Card & {
    employee: Pick<
      Employee,
      "id" | "first_name" | "last_name" | "display_name" | "job_title"
    > | null;
  })[]
> {
  const supabase = await createClient();
  let query = supabase
    .from("cards")
    .select(
      "*, employee:employees(id, first_name, last_name, display_name, job_title)",
    )
    .eq("organisation_id", organisationId)
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.neq("public_status", "archived");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as (Card & {
    employee: Pick<
      Employee,
      "id" | "first_name" | "last_name" | "display_name" | "job_title"
    > | null;
  })[];
}

export async function getCardByEmployee(
  organisationId: string,
  employeeId: string,
): Promise<Card | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function uniqueCardSlug(
  organisationId: string,
  base: string,
): Promise<string> {
  const supabase = await createClient();
  let candidate = slugSchema.parse(base);
  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(candidate)) {
    candidate = `${candidate}-card`;
  }

  for (let i = 0; i < 20; i += 1) {
    const slug = i === 0 ? candidate : `${candidate}-${i + 1}`;
    const { data } = await supabase
      .from("cards")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
  }

  return `${candidate}-${Date.now().toString(36)}`;
}

export async function ensureCardForEmployee(params: {
  organisationId: string;
  employee: Pick<
    Employee,
    "id" | "first_name" | "last_name" | "display_name" | "job_title"
  >;
  layoutId?: CardLayoutId;
  publicStatus?: CardPublicStatus;
}): Promise<Card> {
  const existing = await getCardByEmployee(
    params.organisationId,
    params.employee.id,
  );
  if (existing) return existing;

  const supabase = await createClient();
  const baseName =
    params.employee.display_name ||
    `${params.employee.first_name} ${params.employee.last_name}`;
  const slug = await uniqueCardSlug(
    params.organisationId,
    slugifyOrganisationName(baseName) || "card",
  );

  const status = params.publicStatus ?? "draft";
  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      organisation_id: params.organisationId,
      employee_id: params.employee.id,
      slug,
      layout_id: params.layoutId ?? "corporate",
      public_status: status,
      page_title: baseName,
      meta_description: params.employee.job_title,
      published_at: status === "active" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error || !card) {
    throw new Error(error?.message ?? "Failed to create card");
  }

  const sections = DEFAULT_CARD_SECTION_ORDER.map((type, index) => ({
    card_id: card.id,
    type,
    sort_order: index,
    enabled: true,
    config_json: {},
  }));

  const { error: sectionError } = await supabase
    .from("card_sections")
    .insert(sections);
  if (sectionError) {
    throw new Error(sectionError.message);
  }

  return card;
}

export async function updateCardSettings(input: {
  organisationId: string;
  cardId: string;
  slug?: string;
  layoutId?: CardLayoutId;
  publicStatus?: CardPublicStatus;
  primaryCtaLabel?: string | null;
  primaryCtaUrl?: string | null;
  pageTitle?: string | null;
  metaDescription?: string | null;
}): Promise<Card> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", input.cardId)
    .eq("organisation_id", input.organisationId)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Card not found");
  }

  const updates: Database["public"]["Tables"]["cards"]["Update"] = {};
  let nextSlug: string | null = null;

  if (input.slug) {
    nextSlug = slugSchema.parse(input.slug);
    updates.slug = nextSlug;
  }
  if (input.layoutId) updates.layout_id = input.layoutId;
  if (input.primaryCtaLabel !== undefined) {
    updates.primary_cta_label = input.primaryCtaLabel || null;
  }
  if (input.primaryCtaUrl !== undefined) {
    updates.primary_cta_url = input.primaryCtaUrl || null;
  }
  if (input.pageTitle !== undefined) updates.page_title = input.pageTitle || null;
  if (input.metaDescription !== undefined) {
    updates.meta_description = input.metaDescription || null;
  }
  if (input.publicStatus) {
    updates.public_status = input.publicStatus;
    if (input.publicStatus === "active") {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", input.cardId)
    .eq("organisation_id", input.organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update card");
  }

  // Preserve printed QR / NFC durability when slug changes.
  if (nextSlug && nextSlug !== existing.slug) {
    await supabase
      .from("card_slug_redirects")
      .update({ to_slug: nextSlug })
      .eq("organisation_id", input.organisationId)
      .eq("to_slug", existing.slug);

    await supabase.from("card_slug_redirects").upsert(
      {
        organisation_id: input.organisationId,
        card_id: input.cardId,
        from_slug: existing.slug,
        to_slug: nextSlug,
      },
      { onConflict: "organisation_id,from_slug" },
    );
  }

  return data;
}
