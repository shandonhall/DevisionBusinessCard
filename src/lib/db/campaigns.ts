import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  resolveCampaignsForCard,
  type Campaign,
  type CampaignPlacement,
  type CampaignStatus,
  type ResolvedCampaign,
} from "@/lib/campaigns/types";

function mapCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id),
    organisation_id: String(row.organisation_id),
    brand_id: (row.brand_id as string | null) ?? null,
    location_id: (row.location_id as string | null) ?? null,
    name: String(row.name),
    title: String(row.title),
    body: (row.body as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    cta_label: (row.cta_label as string | null) ?? null,
    cta_url: (row.cta_url as string | null) ?? null,
    placement: row.placement as CampaignPlacement,
    status: row.status as CampaignStatus,
    starts_at: (row.starts_at as string | null) ?? null,
    ends_at: (row.ends_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listCampaigns(organisationId: string): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCampaign(row));
}

export async function listResolvedPublicCampaigns(params: {
  cardId: string;
  organisationId: string;
  brandId?: string | null;
  locationId?: string | null;
}): Promise<ResolvedCampaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_campaigns_for_card", {
    p_card_id: params.cardId,
  });
  if (error) throw new Error(error.message);
  const campaigns = (data ?? []).map((row) =>
    mapCampaign(row as unknown as Record<string, unknown>),
  );
  return resolveCampaignsForCard(campaigns, {
    organisationId: params.organisationId,
    brandId: params.brandId,
    locationId: params.locationId,
  });
}

export async function createCampaign(input: {
  organisationId: string;
  name: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placement: CampaignPlacement;
  status: CampaignStatus;
  brandId?: string | null;
  locationId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<Campaign> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      organisation_id: input.organisationId,
      name: input.name,
      title: input.title,
      body: input.body || null,
      image_url: input.imageUrl || null,
      cta_label: input.ctaLabel || null,
      cta_url: input.ctaUrl || null,
      placement: input.placement,
      status: input.status,
      brand_id: input.brandId || null,
      location_id: input.locationId || null,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create campaign");
  return mapCampaign(data);
}

export async function updateCampaign(input: {
  organisationId: string;
  campaignId: string;
  name: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placement: CampaignPlacement;
  status: CampaignStatus;
  brandId?: string | null;
  locationId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<Campaign> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      name: input.name,
      title: input.title,
      body: input.body || null,
      image_url: input.imageUrl || null,
      cta_label: input.ctaLabel || null,
      cta_url: input.ctaUrl || null,
      placement: input.placement,
      status: input.status,
      brand_id: input.brandId || null,
      location_id: input.locationId || null,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
    })
    .eq("id", input.campaignId)
    .eq("organisation_id", input.organisationId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update campaign");
  return mapCampaign(data);
}
