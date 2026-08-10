import { describe, expect, it } from "vitest";
import {
  canAccessOrganisation,
  canAccessPlatformAdmin,
  canManageOrganisation,
  getPrimaryOrganisationId,
} from "@/lib/permissions/tenancy";

const orgA = "org-a";
const orgB = "org-b";

describe("tenant permission helpers", () => {
  it("allows organisation members to access only their org", () => {
    const memberships = [
      {
        organisation_id: orgA,
        role: "organisation_admin" as const,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(
      canAccessOrganisation({
        profile: { is_platform_admin: false, status: "active" },
        memberships,
        organisationId: orgA,
      }),
    ).toBe(true);

    expect(
      canAccessOrganisation({
        profile: { is_platform_admin: false, status: "active" },
        memberships,
        organisationId: orgB,
      }),
    ).toBe(false);
  });

  it("blocks cross-tenant management attempts", () => {
    const memberships = [
      {
        organisation_id: orgA,
        role: "organisation_admin" as const,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(
      canManageOrganisation({
        profile: { is_platform_admin: false, status: "active" },
        memberships,
        organisationId: orgB,
      }),
    ).toBe(false);
  });

  it("allows platform admins across tenants", () => {
    expect(
      canAccessOrganisation({
        profile: { is_platform_admin: true, status: "active" },
        memberships: [],
        organisationId: orgB,
      }),
    ).toBe(true);

    expect(
      canAccessPlatformAdmin({ is_platform_admin: true, status: "active" }),
    ).toBe(true);

    expect(
      canAccessPlatformAdmin({ is_platform_admin: false, status: "active" }),
    ).toBe(false);
  });

  it("rejects disabled profiles", () => {
    expect(
      canAccessOrganisation({
        profile: { is_platform_admin: true, status: "disabled" },
        memberships: [],
        organisationId: orgA,
      }),
    ).toBe(false);
  });

  it("picks the earliest membership as primary organisation", () => {
    expect(
      getPrimaryOrganisationId([
        {
          organisation_id: orgB,
          created_at: "2026-02-01T00:00:00Z",
        },
        {
          organisation_id: orgA,
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    ).toBe(orgA);
  });
});
