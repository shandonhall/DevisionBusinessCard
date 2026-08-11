import "server-only";

import type { User } from "@supabase/supabase-js";
import { createOrganisationWithAdminMembership } from "@/lib/db/organisations";
import { createClient } from "@/lib/supabase/server";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";
import { createOrganisationSchema } from "@/lib/validation/auth";

/**
 * Completes org bootstrap after email confirmation when Platform Admin
 * metadata is present. Non-platform users cannot create organisations.
 * Safe to call repeatedly - no-ops if memberships already cover the slug
 * or if the caller is not a Platform Admin.
 */
export async function completePendingOrganisationSetup(
  user: User,
): Promise<{ created: boolean; organisationId?: string }> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !canAccessPlatformAdmin({
      is_platform_admin: profile.is_platform_admin,
      status: profile.status,
    })
  ) {
    return { created: false };
  }

  const meta = user.user_metadata ?? {};
  const name =
    typeof meta.organisation_name === "string"
      ? meta.organisation_name
      : "";
  const slug =
    typeof meta.organisation_slug === "string"
      ? meta.organisation_slug
      : "";

  if (!name || !slug) {
    return { created: false };
  }

  const parsed = createOrganisationSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return { created: false };
  }

  const { data: existingOrg } = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (existingOrg) {
    return { created: false, organisationId: existingOrg.id };
  }

  const organisation = await createOrganisationWithAdminMembership({
    userId: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
  });

  return { created: true, organisationId: organisation.id };
}
