export const CAMPAIGN_PLACEMENTS = ["desktop_left", "desktop_right"] as const;
export type CampaignPlacement = (typeof CAMPAIGN_PLACEMENTS)[number];

export const CAMPAIGN_STATUSES = ["draft", "active", "archived"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type Campaign = {
  id: string;
  organisation_id: string;
  brand_id: string | null;
  location_id: string | null;
  name: string;
  title: string;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  placement: CampaignPlacement;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ResolvedCampaign = Pick<
  Campaign,
  | "id"
  | "title"
  | "body"
  | "image_url"
  | "cta_label"
  | "cta_url"
  | "placement"
  | "brand_id"
  | "location_id"
>;

export type CampaignResolveInput = {
  organisationId: string;
  brandId?: string | null;
  locationId?: string | null;
  now?: Date;
};

/**
 * Most specific active campaign wins: location → brand → organisation.
 * One winner per placement. No campaign → omit the slot.
 */
export function resolveCampaignsForCard(
  campaigns: Campaign[],
  input: CampaignResolveInput,
): ResolvedCampaign[] {
  const now = input.now ?? new Date();
  const active = campaigns.filter((campaign) => {
    if (campaign.organisation_id !== input.organisationId) return false;
    if (campaign.status !== "active") return false;
    if (campaign.starts_at && new Date(campaign.starts_at) > now) return false;
    if (campaign.ends_at && new Date(campaign.ends_at) < now) return false;
    return true;
  });

  const winners: ResolvedCampaign[] = [];
  for (const placement of ["desktop_left", "desktop_right"] as const) {
    const pool = active.filter((campaign) => campaign.placement === placement);
    const locationMatch = input.locationId
      ? pool.find((campaign) => campaign.location_id === input.locationId)
      : undefined;
    const brandMatch = input.brandId
      ? pool.find(
          (campaign) =>
            campaign.brand_id === input.brandId && !campaign.location_id,
        )
      : undefined;
    const orgMatch = pool.find(
      (campaign) => !campaign.brand_id && !campaign.location_id,
    );
    const chosen = locationMatch ?? brandMatch ?? orgMatch;
    if (chosen) {
      winners.push({
        id: chosen.id,
        title: chosen.title,
        body: chosen.body,
        image_url: chosen.image_url,
        cta_label: chosen.cta_label,
        cta_url: chosen.cta_url,
        placement: chosen.placement,
        brand_id: chosen.brand_id,
        location_id: chosen.location_id,
      });
    }
  }
  return winners;
}
