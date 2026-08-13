"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeActiveOrganisationCookie } from "@/lib/auth/active-organisation";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

const organisationIdSchema = z.string().uuid();

/** Same-origin relative path only (open-redirect safe). */
function safeNextPath(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return "/dashboard";
  const value = raw.trim();
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) {
    return "/dashboard";
  }
  return value;
}

/**
 * Keep the current dashboard path, but stamp `?org=` so the App Router
 * cannot reuse a stale RSC payload from the previous tenant on the same URL.
 */
function redirectPathForOrganisation(
  rawNext: FormDataEntryValue | null,
  organisationId: string,
): string {
  const base = safeNextPath(rawNext);
  const url = new URL(base, "http://local.invalid");
  url.searchParams.set("org", organisationId);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Platform admins only - sets the active dashboard tenant cookie, then
 * redirects so the next request reads the new cookie (revalidate alone can
 * re-render with the previous request cookies and appear to "bounce back").
 */
export async function switchActiveOrganisationAction(
  formData: FormData,
): Promise<void> {
  const context = await requireAuthContext();
  if (!canAccessPlatformAdmin(context.profile)) {
    throw new Error("Only platform admins can switch organisations");
  }

  const parsed = organisationIdSchema.safeParse(
    formData.get("organisationId"),
  );
  if (!parsed.success) {
    throw new Error("Invalid organisation");
  }

  const supabase = await createClient();
  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!organisation) {
    throw new Error("Organisation not found");
  }

  await writeActiveOrganisationCookie(organisation.id);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard/cards");
  revalidatePath("/dashboard/team");
  redirect(redirectPathForOrganisation(formData.get("next"), organisation.id));
}
