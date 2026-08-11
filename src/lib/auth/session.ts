import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readActiveOrganisationCookie } from "@/lib/auth/active-organisation";
import {
  canAccessOrganisation,
  canAccessPlatformAdmin,
  canManageOrganisation,
  resolveActiveOrganisationId,
} from "@/lib/permissions/tenancy";
import type { Membership, Organisation, Profile } from "@/types/database";

export type AuthContext = {
  userId: string;
  email: string;
  profile: Profile;
  memberships: Membership[];
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  return user;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("*").eq("user_id", user.id),
  ]);

  if (!profile || profile.status !== "active") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    memberships: memberships ?? [],
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/auth/sign-in");
  }
  return context;
}

export async function requirePlatformAdmin(): Promise<AuthContext> {
  const context = await requireAuthContext();
  if (!canAccessPlatformAdmin(context.profile)) {
    redirect("/dashboard");
  }
  return context;
}

export async function requireOrganisationAccess(organisationId: string) {
  const context = await requireAuthContext();
  if (
    !canAccessOrganisation({
      profile: context.profile,
      memberships: context.memberships,
      organisationId,
    })
  ) {
    redirect("/dashboard");
  }
  return context;
}

export async function requireOrganisationAdmin(organisationId: string) {
  const context = await requireAuthContext();
  if (
    !canManageOrganisation({
      profile: context.profile,
      memberships: context.memberships,
      organisationId,
    })
  ) {
    redirect("/dashboard");
  }
  return context;
}

export async function getPrimaryOrganisation(
  context: AuthContext,
): Promise<Organisation | null> {
  // Opt out of any request memoisation that could reuse a prior tenant.
  await connection();

  const isPlatformAdmin = canAccessPlatformAdmin(context.profile);
  const preferred = isPlatformAdmin
    ? await readActiveOrganisationCookie()
    : null;

  const organisationId = resolveActiveOrganisationId({
    memberships: context.memberships,
    isPlatformAdmin,
    preferredOrganisationId: preferred,
  });
  if (!organisationId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", organisationId)
    .maybeSingle();

  // Stale cookie / deleted tenant → fall back to membership primary.
  if (!data && preferred && preferred === organisationId) {
    const fallbackId = resolveActiveOrganisationId({
      memberships: context.memberships,
      isPlatformAdmin: false,
    });
    if (!fallbackId || fallbackId === organisationId) return null;
    const { data: fallback } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", fallbackId)
      .maybeSingle();
    return fallback;
  }

  return data;
}
