import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BrandKit, Organisation } from "@/types/database";
import { platformDefaultTokens } from "@/lib/branding/tokens";

export async function getOrganisationById(
  organisationId: string,
): Promise<Organisation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", organisationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDefaultBrandKit(
  organisation: Pick<Organisation, "id" | "default_brand_kit_id">,
): Promise<BrandKit | null> {
  const supabase = await createClient();

  if (organisation.default_brand_kit_id) {
    const { data, error } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("id", organisation.default_brand_kit_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
  }

  const { data: existing, error: listError } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("organisation_id", organisation.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (listError) throw new Error(listError.message);
  return existing;
}

/**
 * Ensures every organisation has a default brand kit (idempotent).
 * Called from brand editor / org create — never hard-codes a client.
 */
export async function ensureDefaultBrandKit(
  organisationId: string,
): Promise<BrandKit> {
  const supabase = await createClient();
  const organisation = await getOrganisationById(organisationId);
  if (!organisation) {
    throw new Error("Organisation not found");
  }

  const existing = await getDefaultBrandKit(organisation);
  if (existing) {
    if (!organisation.default_brand_kit_id) {
      await supabase
        .from("organisations")
        .update({ default_brand_kit_id: existing.id })
        .eq("id", organisationId);
    }
    return existing;
  }

  const { data: kit, error } = await supabase
    .from("brand_kits")
    .insert({
      organisation_id: organisationId,
      name: "Organisation default",
      primary_colour: platformDefaultTokens.primary,
      secondary_colour: platformDefaultTokens.secondary,
      accent_colour: platformDefaultTokens.accent,
      background_colour: platformDefaultTokens.background,
      surface_colour: platformDefaultTokens.surface,
      text_colour: platformDefaultTokens.text,
      muted_text_colour: platformDefaultTokens.mutedText,
      heading_font: platformDefaultTokens.headingFont,
      body_font: platformDefaultTokens.bodyFont,
      button_radius: platformDefaultTokens.buttonRadius,
      card_radius: platformDefaultTokens.cardRadius,
      default_layout_id: platformDefaultTokens.layoutId,
    })
    .select("*")
    .single();

  if (error || !kit) {
    throw new Error(error?.message ?? "Failed to create brand kit");
  }

  const { error: linkError } = await supabase
    .from("organisations")
    .update({ default_brand_kit_id: kit.id })
    .eq("id", organisationId);

  if (linkError) {
    throw new Error(linkError.message);
  }

  return kit;
}

export async function updateOrganisationDetails(input: {
  organisationId: string;
  name: string;
  legalName?: string | null;
  website?: string | null;
}): Promise<Organisation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisations")
    .update({
      name: input.name,
      legal_name: input.legalName || null,
      website: input.website || null,
    })
    .eq("id", input.organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update organisation");
  }
  return data;
}

export async function updateBrandKitRecord(
  input: {
    brandKitId: string;
    organisationId: string;
  } & Partial<BrandKit>,
): Promise<BrandKit> {
  const supabase = await createClient();
  const { brandKitId, organisationId, ...fields } = input;

  const { data, error } = await supabase
    .from("brand_kits")
    .update(fields)
    .eq("id", brandKitId)
    .eq("organisation_id", organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update brand kit");
  }
  return data;
}
