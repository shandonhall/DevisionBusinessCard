import {
  brandKitToTokenPartial,
  resolveDesignTokens,
  type DesignTokens,
} from "@/lib/branding/tokens";
import { resolveBrandDNA } from "@/lib/experience/resolve";
import {
  applyDriveMarqueToTokens,
  getDriveMarqueConfig,
  resolveDriveMarqueId,
} from "@/lib/experience/drive-marque";
import type { BrandKit, CardLayoutId, Json } from "@/types/database";
import type { PublicCardSection, PublicCardViewModel } from "@/types/card";

type PublicCardRpcPayload = {
  card: {
    id: string;
    slug: string;
    layout_id: CardLayoutId;
    page_title: string | null;
    meta_description: string | null;
    primary_cta_label: string | null;
    primary_cta_url: string | null;
    public_status: string;
  };
  organisation: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    white_label_enabled: boolean;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    job_title: string | null;
    department: string | null;
    email: string | null;
    mobile: string | null;
    whatsapp: string | null;
    linkedin_url: string | null;
    profile_photo_url: string | null;
    bio: string | null;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    logo_url: string | null;
  } | null;
  location: {
    id: string;
    name: string;
    slug: string;
    type: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  } | null;
  marques?: Array<{
    id: string;
    name: string;
    slug: string;
    website: string | null;
    logo_url: string | null;
  }> | null;
  organisation_kit: BrandKit | null;
  brand_kit: BrandKit | null;
  card_kit: BrandKit | null;
  sections: PublicCardSection[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePublicCardPayload(
  payload: Json | null,
): PublicCardRpcPayload | null {
  if (!isRecord(payload) || !isRecord(payload.card) || !isRecord(payload.organisation) || !isRecord(payload.employee)) {
    return null;
  }
  return payload as unknown as PublicCardRpcPayload;
}

export function resolvePublicCardTokens(payload: PublicCardRpcPayload): DesignTokens {
  return resolveDesignTokens({
    organisationKit: brandKitToTokenPartial(payload.organisation_kit),
    brandKit: brandKitToTokenPartial(payload.brand_kit),
    cardOverrides: brandKitToTokenPartial(payload.card_kit) ?? undefined,
  });
}

export function toPublicCardViewModel(
  payload: PublicCardRpcPayload,
): PublicCardViewModel {
  const tokens = resolvePublicCardTokens(payload);
  const displayName =
    payload.employee.display_name?.trim() ||
    `${payload.employee.first_name} ${payload.employee.last_name}`.trim();

  const layoutId =
    payload.card.layout_id || tokens.layoutId || ("corporate" as CardLayoutId);

  // Prefer brand logo, then kit logos.
  const logoUrl =
    payload.brand?.logo_url ||
    tokens.logoUrl ||
    payload.brand_kit?.logo_url ||
    payload.organisation_kit?.logo_url ||
    null;

  const marques = (payload.marques ?? []).map((marque) => ({
    id: marque.id,
    name: marque.name,
    slug: marque.slug,
    website: marque.website,
    logoUrl: marque.logo_url,
  }));

  let brandDNA = resolveBrandDNA({
    tokens: {
      ...tokens,
      logoUrl,
      layoutId,
    },
    organisationKit: payload.organisation_kit,
    brandKit: payload.brand_kit,
    cardKit: payload.card_kit,
  });

  let resolvedTokens = {
    ...tokens,
    logoUrl,
    layoutId,
  };

  if (brandDNA.experience.preset === "drive") {
    const driveMarque = resolveDriveMarqueId(marques);
    const marqueConfig = getDriveMarqueConfig(driveMarque);
    resolvedTokens = applyDriveMarqueToTokens(resolvedTokens, driveMarque);
    brandDNA = {
      ...brandDNA,
      driveMarque,
      tokens: resolvedTokens,
      visual: { ...brandDNA.visual, ...marqueConfig.visual },
      experience: {
        ...brandDNA.experience,
        ...marqueConfig.experience,
        preset: "drive",
      },
    };
  }

  return {
    organisation: {
      id: payload.organisation.id,
      name: payload.organisation.name,
      slug: payload.organisation.slug,
      website: payload.organisation.website,
      whiteLabelEnabled: payload.organisation.white_label_enabled,
    },
    brand: payload.brand
      ? {
          id: payload.brand.id,
          name: payload.brand.name,
          slug: payload.brand.slug,
          website: payload.brand.website,
          logoUrl: payload.brand.logo_url,
        }
      : null,
    marques,
    location: payload.location
      ? {
          id: payload.location.id,
          name: payload.location.name,
          slug: payload.location.slug,
          type: payload.location.type,
          address: payload.location.address,
          phone: payload.location.phone,
          email: payload.location.email,
          website: payload.location.website,
        }
      : null,
    employee: {
      id: payload.employee.id,
      firstName: payload.employee.first_name,
      lastName: payload.employee.last_name,
      displayName,
      jobTitle: payload.employee.job_title,
      department: payload.employee.department,
      email: payload.employee.email,
      mobile: payload.employee.mobile,
      whatsapp: payload.employee.whatsapp,
      linkedinUrl: payload.employee.linkedin_url,
      profilePhotoUrl: payload.employee.profile_photo_url,
      bio: payload.employee.bio,
    },
    card: {
      id: payload.card.id,
      slug: payload.card.slug,
      layoutId,
      pageTitle: payload.card.page_title,
      metaDescription: payload.card.meta_description,
      primaryCtaLabel: payload.card.primary_cta_label,
      primaryCtaUrl: payload.card.primary_cta_url,
      publicStatus: payload.card.public_status,
      publicPath: `/${payload.organisation.slug}/${payload.card.slug}`,
    },
    sections: (payload.sections ?? []).filter((section) => section.enabled),
    tokens: resolvedTokens,
    brandDNA,
  };
}

/**
 * Pure guard used in tests: a payload for org A must never resolve as org B.
 */
export function assertPublicCardTenantMatch(
  view: PublicCardViewModel,
  organisationSlug: string,
  cardSlug: string,
): boolean {
  return (
    view.organisation.slug === organisationSlug &&
    view.card.slug === cardSlug
  );
}
