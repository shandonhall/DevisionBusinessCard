import { describe, expect, it } from "vitest";
import {
  canAccessOrganisation,
  canAccessPlatformAdmin,
  canManageOrganisation,
  resolveActiveOrganisationId,
} from "@/lib/permissions/tenancy";

/**
 * App-layer isolation matrix (Phase 3).
 * These tests document the intended boundary before CMH is seeded:
 * Org A admin must never manage Org B, and vice versa.
 * Platform Admin may manage both.
 */
const orgA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const aggAdminMemberships = [
  {
    organisation_id: orgA,
    role: "organisation_admin" as const,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const cmhAdminMemberships = [
  {
    organisation_id: orgB,
    role: "organisation_admin" as const,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const activeMember = {
  is_platform_admin: false,
  status: "active" as const,
};

const platformAdmin = {
  is_platform_admin: true,
  status: "active" as const,
};

describe("tenant isolation matrix (app layer)", () => {
  it("Org A admin cannot access or manage Org B", () => {
    expect(
      canAccessOrganisation({
        profile: activeMember,
        memberships: aggAdminMemberships,
        organisationId: orgB,
      }),
    ).toBe(false);

    expect(
      canManageOrganisation({
        profile: activeMember,
        memberships: aggAdminMemberships,
        organisationId: orgB,
      }),
    ).toBe(false);
  });

  it("Org B admin cannot access or manage Org A", () => {
    expect(
      canAccessOrganisation({
        profile: activeMember,
        memberships: cmhAdminMemberships,
        organisationId: orgA,
      }),
    ).toBe(false);

    expect(
      canManageOrganisation({
        profile: activeMember,
        memberships: cmhAdminMemberships,
        organisationId: orgA,
      }),
    ).toBe(false);
  });

  it("Org A admin can manage only Org A", () => {
    expect(
      canManageOrganisation({
        profile: activeMember,
        memberships: aggAdminMemberships,
        organisationId: orgA,
      }),
    ).toBe(true);
  });

  it("employee role cannot manage their organisation", () => {
    expect(
      canManageOrganisation({
        profile: activeMember,
        memberships: [
          {
            organisation_id: orgA,
            role: "employee",
          },
        ],
        organisationId: orgA,
      }),
    ).toBe(false);

    expect(
      canAccessOrganisation({
        profile: activeMember,
        memberships: [
          {
            organisation_id: orgA,
            role: "employee",
          },
        ],
        organisationId: orgA,
      }),
    ).toBe(true);
  });

  it("Platform Admin can manage Org A and Org B", () => {
    expect(
      canManageOrganisation({
        profile: platformAdmin,
        memberships: [],
        organisationId: orgA,
      }),
    ).toBe(true);
    expect(
      canManageOrganisation({
        profile: platformAdmin,
        memberships: [],
        organisationId: orgB,
      }),
    ).toBe(true);
    expect(canAccessPlatformAdmin(platformAdmin)).toBe(true);
  });

  it("disabled Platform Admin loses all access", () => {
    const disabled = { is_platform_admin: true, status: "disabled" as const };
    expect(canAccessPlatformAdmin(disabled)).toBe(false);
    expect(
      canAccessOrganisation({
        profile: disabled,
        memberships: [],
        organisationId: orgA,
      }),
    ).toBe(false);
  });

  it("non-platform users cannot switch active organisation via preferred cookie", () => {
    expect(
      resolveActiveOrganisationId({
        memberships: aggAdminMemberships,
        isPlatformAdmin: false,
        preferredOrganisationId: orgB,
      }),
    ).toBe(orgA);
  });

  it("Platform Admin may switch preferred organisation", () => {
    expect(
      resolveActiveOrganisationId({
        memberships: aggAdminMemberships,
        isPlatformAdmin: true,
        preferredOrganisationId: orgB,
      }),
    ).toBe(orgB);
  });

  it("multi-membership user only accesses orgs they belong to", () => {
    const dual = [
      ...aggAdminMemberships,
      {
        organisation_id: orgB,
        role: "employee" as const,
        created_at: "2026-02-01T00:00:00Z",
      },
    ];

    expect(
      canAccessOrganisation({
        profile: activeMember,
        memberships: dual,
        organisationId: orgA,
      }),
    ).toBe(true);
    expect(
      canAccessOrganisation({
        profile: activeMember,
        memberships: dual,
        organisationId: orgB,
      }),
    ).toBe(true);
    expect(
      canManageOrganisation({
        profile: activeMember,
        memberships: dual,
        organisationId: orgB,
      }),
    ).toBe(false);
  });
});
