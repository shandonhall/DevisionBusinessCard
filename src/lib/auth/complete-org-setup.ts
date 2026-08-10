import "server-only";

import type { User } from "@supabase/supabase-js";
import { createOrganisationWithAdminMembership } from "@/lib/db/organisations";
import { createClient } from "@/lib/supabase/server";
import { createOrganisationSchema } from "@/lib/validation/auth";

/**
 * Completes org bootstrap after email confirmation (or when signup
 * returned no session). Safe to call repeatedly — no-ops if memberships exist.
 */
export async function completePendingOrganisationSetup(
  user: User,
): Promise<{ created: boolean; organisationId?: string }> {
  const supabase = await createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (memberships && memberships.length > 0) {
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

  const organisation = await createOrganisationWithAdminMembership({
    userId: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
  });

  return { created: true, organisationId: organisation.id };
}
