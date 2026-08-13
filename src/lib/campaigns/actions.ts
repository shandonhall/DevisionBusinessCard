"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisationAdmin } from "@/lib/auth/session";
import { createCampaign, updateCampaign } from "@/lib/db/campaigns";
import type { CampaignPlacement, CampaignStatus } from "@/lib/campaigns/types";

export type CampaignActionResult = { ok: boolean; error?: string };

async function run(
  organisationId: string,
  work: () => Promise<void>,
): Promise<CampaignActionResult> {
  try {
    await requireOrganisationAdmin(organisationId);
    await work();
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/campaigns");
    revalidatePath("/dashboard/analytics");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Action failed",
    };
  }
}

function readPlacement(value: FormDataEntryValue | null): CampaignPlacement {
  return value === "desktop_left" ? "desktop_left" : "desktop_right";
}

function readStatus(value: FormDataEntryValue | null): CampaignStatus {
  if (value === "active" || value === "archived") return value;
  return "draft";
}

export async function createCampaignAction(
  _prev: CampaignActionResult,
  formData: FormData,
): Promise<CampaignActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return run(organisationId, async () => {
    await createCampaign({
      organisationId,
      name: String(formData.get("name") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim() || null,
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      ctaLabel: String(formData.get("ctaLabel") || "").trim() || null,
      ctaUrl: String(formData.get("ctaUrl") || "").trim() || null,
      placement: readPlacement(formData.get("placement")),
      status: readStatus(formData.get("status")),
      brandId: String(formData.get("brandId") || "").trim() || null,
      locationId: String(formData.get("locationId") || "").trim() || null,
      startsAt: String(formData.get("startsAt") || "").trim() || null,
      endsAt: String(formData.get("endsAt") || "").trim() || null,
    });
  });
}

export async function updateCampaignAction(
  _prev: CampaignActionResult,
  formData: FormData,
): Promise<CampaignActionResult> {
  const organisationId = String(formData.get("organisationId") || "");
  return run(organisationId, async () => {
    await updateCampaign({
      organisationId,
      campaignId: String(formData.get("campaignId") || ""),
      name: String(formData.get("name") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim() || null,
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      ctaLabel: String(formData.get("ctaLabel") || "").trim() || null,
      ctaUrl: String(formData.get("ctaUrl") || "").trim() || null,
      placement: readPlacement(formData.get("placement")),
      status: readStatus(formData.get("status")),
      brandId: String(formData.get("brandId") || "").trim() || null,
      locationId: String(formData.get("locationId") || "").trim() || null,
      startsAt: String(formData.get("startsAt") || "").trim() || null,
      endsAt: String(formData.get("endsAt") || "").trim() || null,
    });
  });
}
