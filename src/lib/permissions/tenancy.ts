/**
 * Pure permission helpers - unit-testable without Supabase.
 * Server loaders still re-check membership via RLS-backed queries.
 */

import type { Membership, MembershipRole, Profile } from "@/types/database";

export const ORG_ADMIN_ROLES: MembershipRole[] = ["organisation_admin"];

export function canAccessOrganisation(params: {
  profile: Pick<Profile, "is_platform_admin" | "status"> | null;
  memberships: Pick<Membership, "organisation_id" | "role">[];
  organisationId: string;
}): boolean {
  const { profile, memberships, organisationId } = params;
  if (!profile || profile.status !== "active") return false;
  if (profile.is_platform_admin) return true;
  return memberships.some((m) => m.organisation_id === organisationId);
}

export function canManageOrganisation(params: {
  profile: Pick<Profile, "is_platform_admin" | "status"> | null;
  memberships: Pick<Membership, "organisation_id" | "role">[];
  organisationId: string;
}): boolean {
  const { profile, memberships, organisationId } = params;
  if (!profile || profile.status !== "active") return false;
  if (profile.is_platform_admin) return true;
  return memberships.some(
    (m) =>
      m.organisation_id === organisationId &&
      ORG_ADMIN_ROLES.includes(m.role),
  );
}

export function canAccessPlatformAdmin(
  profile: Pick<Profile, "is_platform_admin" | "status"> | null,
): boolean {
  return Boolean(profile?.is_platform_admin && profile.status === "active");
}

export function getPrimaryOrganisationId(
  memberships: Pick<Membership, "organisation_id" | "created_at">[],
): string | null {
  if (memberships.length === 0) return null;
  const sorted = [...memberships].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  return sorted[0]?.organisation_id ?? null;
}

/**
 * Active dashboard tenant. Platform admins may override via preferred id;
 * everyone else always uses their oldest membership.
 */
export function resolveActiveOrganisationId(params: {
  memberships: Pick<Membership, "organisation_id" | "created_at">[];
  isPlatformAdmin: boolean;
  preferredOrganisationId?: string | null;
  /** When set, preferred id must be in this list (e.g. orgs visible to the admin). */
  allowedOrganisationIds?: string[] | null;
}): string | null {
  const preferred = params.preferredOrganisationId?.trim() || null;
  if (params.isPlatformAdmin && preferred) {
    if (
      !params.allowedOrganisationIds ||
      params.allowedOrganisationIds.includes(preferred)
    ) {
      return preferred;
    }
  }
  return getPrimaryOrganisationId(params.memberships);
}
