import { describe, expect, it } from "vitest";
import {
  resolveCampaignsForCard,
  type Campaign,
} from "@/lib/campaigns/types";

function campaign(partial: Partial<Campaign> & Pick<Campaign, "id" | "placement">): Campaign {
  return {
    organisation_id: "org-a",
    brand_id: null,
    location_id: null,
    name: partial.id,
    title: partial.id,
    body: null,
    image_url: null,
    cta_label: null,
    cta_url: null,
    status: "active",
    starts_at: null,
    ends_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("campaign resolution", () => {
  it("returns nothing when no campaign is configured", () => {
    expect(
      resolveCampaignsForCard([], {
        organisationId: "org-a",
        brandId: "brand-1",
        locationId: "loc-1",
      }),
    ).toEqual([]);
  });

  it("prefers location then brand then organisation", () => {
    const resolved = resolveCampaignsForCard(
      [
        campaign({ id: "org", placement: "desktop_right" }),
        campaign({
          id: "brand",
          placement: "desktop_right",
          brand_id: "brand-1",
        }),
        campaign({
          id: "loc",
          placement: "desktop_right",
          brand_id: "brand-1",
          location_id: "loc-1",
        }),
      ],
      {
        organisationId: "org-a",
        brandId: "brand-1",
        locationId: "loc-1",
      },
    );
    expect(resolved.map((item) => item.id)).toEqual(["loc"]);
  });

  it("ignores other organisations and inactive rows", () => {
    const resolved = resolveCampaignsForCard(
      [
        campaign({
          id: "other-org",
          placement: "desktop_left",
          organisation_id: "org-b",
        }),
        campaign({
          id: "draft",
          placement: "desktop_left",
          status: "draft",
        }),
      ],
      { organisationId: "org-a" },
    );
    expect(resolved).toEqual([]);
  });
});
