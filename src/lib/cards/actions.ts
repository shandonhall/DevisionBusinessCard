"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisationAdmin } from "@/lib/auth/session";
import {
  ensureCardForEmployee,
  updateCardSettings,
} from "@/lib/db/cards";
import { createClient } from "@/lib/supabase/server";
import type { CardLayoutId, CardPublicStatus } from "@/types/database";

export type CardActionResult = {
  ok: boolean;
  error?: string;
  publicPath?: string;
};

export async function createCardForEmployeeAction(
  _prev: CardActionResult,
  formData: FormData,
): Promise<CardActionResult> {
  try {
    const organisationId = String(formData.get("organisationId") || "");
    const employeeId = String(formData.get("employeeId") || "");
    await requireOrganisationAdmin(organisationId);

    const supabase = await createClient();
    const [{ data: employee }, { data: organisation }] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, display_name, job_title")
        .eq("id", employeeId)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("slug")
        .eq("id", organisationId)
        .maybeSingle(),
    ]);

    if (!employee || !organisation) {
      return { ok: false, error: "Employee not found in this organisation" };
    }

    const card = await ensureCardForEmployee({
      organisationId,
      employee,
      publicStatus: "active",
      layoutId: (formData.get("layoutId") as CardLayoutId) || "corporate",
    });

    // If card already existed as draft, activate it.
    const updated =
      card.public_status === "active"
        ? card
        : await updateCardSettings({
            organisationId,
            cardId: card.id,
            publicStatus: "active",
            layoutId: (formData.get("layoutId") as CardLayoutId) || card.layout_id,
          });

    revalidatePath("/dashboard/cards");
    revalidatePath("/dashboard/team");
    return {
      ok: true,
      publicPath: `/${organisation.slug}/${updated.slug}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create card",
    };
  }
}

export async function updateCardAction(
  _prev: CardActionResult,
  formData: FormData,
): Promise<CardActionResult> {
  try {
    const organisationId = String(formData.get("organisationId") || "");
    const cardId = String(formData.get("cardId") || "");
    await requireOrganisationAdmin(organisationId);

    const supabase = await createClient();
    const { data: organisation } = await supabase
      .from("organisations")
      .select("slug")
      .eq("id", organisationId)
      .maybeSingle();

    const card = await updateCardSettings({
      organisationId,
      cardId,
      slug: String(formData.get("slug") || "") || undefined,
      layoutId: (formData.get("layoutId") as CardLayoutId) || undefined,
      publicStatus:
        (formData.get("publicStatus") as CardPublicStatus) || undefined,
      primaryCtaLabel: String(formData.get("primaryCtaLabel") || "") || null,
      primaryCtaUrl: String(formData.get("primaryCtaUrl") || "") || null,
      pageTitle: String(formData.get("pageTitle") || "") || null,
      metaDescription: String(formData.get("metaDescription") || "") || null,
    });

    revalidatePath("/dashboard/cards");
    revalidatePath(`/dashboard/cards/${card.id}/preview`);
    revalidatePath(`/${organisation?.slug}/${card.slug}`);
    return {
      ok: true,
      publicPath: organisation ? `/${organisation.slug}/${card.slug}` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update card",
    };
  }
}

export async function getAdminCardPreviewAction(input: {
  organisationId: string;
  cardId: string;
}): Promise<
  | { ok: true; model: import("@/types/card").PublicCardViewModel; absoluteCardUrl: string }
  | { ok: false; error: string }
> {
  try {
    await requireOrganisationAdmin(input.organisationId);
    const { getCardPreviewForAdmin } = await import("@/lib/db/cards");
    const { getServerEnv } = await import("@/lib/validation/env");
    const model = await getCardPreviewForAdmin(input);
    if (!model) return { ok: false, error: "Card not found" };
    const absoluteCardUrl = `${getServerEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${model.card.publicPath}`;
    return { ok: true, model, absoluteCardUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load preview",
    };
  }
}
