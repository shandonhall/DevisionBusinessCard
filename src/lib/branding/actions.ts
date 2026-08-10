"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisationAdmin } from "@/lib/auth/session";
import {
  ensureDefaultBrandKit,
  updateBrandKitRecord,
  updateOrganisationDetails,
} from "@/lib/db/branding";
import { importBrandFromWebsiteUrl } from "@/lib/branding/fetch-website-brand";
import type { WebsiteBrandSuggestion } from "@/lib/branding/extract-from-website";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  importBrandFromWebsiteSchema,
  updateBrandKitSchema,
  updateOrganisationSchema,
} from "@/lib/validation/branding";

export type ActionResult = {
  ok: boolean;
  error?: string;
  logoUrl?: string;
};

export type ImportBrandActionResult = {
  ok: boolean;
  error?: string;
  suggestion?: WebsiteBrandSuggestion;
};

export async function updateOrganisationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = updateOrganisationSchema.parse({
      organisationId: formData.get("organisationId"),
      name: formData.get("name"),
      legalName: formData.get("legalName"),
      website: formData.get("website"),
    });

    await requireOrganisationAdmin(parsed.organisationId);
    await updateOrganisationDetails({
      organisationId: parsed.organisationId,
      name: parsed.name,
      legalName: parsed.legalName,
      website: parsed.website,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/brand");
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function importBrandFromWebsiteAction(
  _prev: ImportBrandActionResult,
  formData: FormData,
): Promise<ImportBrandActionResult> {
  try {
    const parsed = importBrandFromWebsiteSchema.parse({
      organisationId: formData.get("organisationId"),
      websiteUrl: formData.get("websiteUrl"),
    });

    await requireOrganisationAdmin(parsed.organisationId);
    const suggestion = await importBrandFromWebsiteUrl(parsed.websiteUrl);
    return { ok: true, suggestion };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not analyse that website",
    };
  }
}

export async function updateBrandKitAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = updateBrandKitSchema.parse({
      brandKitId: formData.get("brandKitId"),
      organisationId: formData.get("organisationId"),
      name: formData.get("name"),
      primaryColour: formData.get("primaryColour"),
      secondaryColour: formData.get("secondaryColour"),
      accentColour: formData.get("accentColour"),
      backgroundColour: formData.get("backgroundColour"),
      surfaceColour: formData.get("surfaceColour"),
      textColour: formData.get("textColour"),
      mutedTextColour: formData.get("mutedTextColour"),
      headingFont: formData.get("headingFont"),
      bodyFont: formData.get("bodyFont"),
      buttonRadius: formData.get("buttonRadius"),
      cardRadius: formData.get("cardRadius"),
      defaultLayoutId: formData.get("defaultLayoutId"),
      logoUrl: formData.get("logoUrl"),
    });

    await requireOrganisationAdmin(parsed.organisationId);

    await updateBrandKitRecord({
      brandKitId: parsed.brandKitId,
      organisationId: parsed.organisationId,
      name: parsed.name,
      primary_colour: parsed.primaryColour,
      secondary_colour: parsed.secondaryColour,
      accent_colour: parsed.accentColour,
      background_colour: parsed.backgroundColour,
      surface_colour: parsed.surfaceColour,
      text_colour: parsed.textColour,
      muted_text_colour: parsed.mutedTextColour,
      heading_font: parsed.headingFont,
      body_font: parsed.bodyFont,
      button_radius: parsed.buttonRadius,
      card_radius: parsed.cardRadius,
      default_layout_id: parsed.defaultLayoutId,
      logo_url: parsed.logoUrl || null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/brand");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function uploadLogoAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const organisationId = String(formData.get("organisationId") || "");
    const brandKitId = String(formData.get("brandKitId") || "");
    const file = formData.get("logo");

    if (!organisationId || !brandKitId) {
      return { ok: false, error: "Missing organisation or brand kit." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a logo image to upload." };
    }
    if (file.size > MAX_LOGO_BYTES) {
      return { ok: false, error: "Logo must be 5MB or smaller." };
    }
    if (
      !ALLOWED_LOGO_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_LOGO_MIME_TYPES)[number],
      )
    ) {
      return {
        ok: false,
        error: "Logo must be PNG, JPEG, WebP, or SVG.",
      };
    }

    await requireOrganisationAdmin(organisationId);
    await ensureDefaultBrandKit(organisationId);

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/webp"
            ? "webp"
            : "svg";

    const path = `${organisationId}/logos/${brandKitId}-${Date.now()}.${extension}`;
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("organisation-assets")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("organisation-assets").getPublicUrl(path);

    await updateBrandKitRecord({
      brandKitId,
      organisationId,
      logo_url: publicUrl,
    });

    revalidatePath("/dashboard/brand");
    return { ok: true, logoUrl: publicUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
