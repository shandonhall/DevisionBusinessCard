"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeActiveOrganisationCookie } from "@/lib/auth/active-organisation";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

const organisationIdSchema = z.string().uuid();

/**
 * Platform admins only - sets the active dashboard tenant cookie.
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
  revalidatePath("/admin", "layout");
}
