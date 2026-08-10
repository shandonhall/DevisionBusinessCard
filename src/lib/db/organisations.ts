import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Organisation } from "@/types/database";
import { createOrganisationSchema } from "@/lib/validation/auth";
import { ensureDefaultBrandKit } from "@/lib/db/branding";

export async function listAccessibleOrganisations(): Promise<Organisation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createOrganisationWithAdminMembership(input: {
  userId: string;
  name: string;
  slug: string;
  legalName?: string | null;
  website?: string | null;
}) {
  const parsed = createOrganisationSchema.parse({
    name: input.name,
    slug: input.slug,
    legalName: input.legalName,
    website: input.website ?? "",
  });

  const supabase = await createClient();

  const { data: organisation, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      legal_name: parsed.legalName || null,
      website: parsed.website || null,
      status: "active",
    })
    .select("*")
    .single();

  if (orgError || !organisation) {
    throw new Error(orgError?.message ?? "Failed to create organisation");
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    user_id: input.userId,
    organisation_id: organisation.id,
    role: "organisation_admin",
  });

  if (membershipError) {
    await supabase.from("organisations").delete().eq("id", organisation.id);
    throw new Error(membershipError.message);
  }

  try {
    await ensureDefaultBrandKit(organisation.id);
  } catch {
    // Org + membership remain valid; brand editor can create the kit later.
  }

  return organisation;
}
