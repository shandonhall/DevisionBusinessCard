import type { CardLayoutId, CardSectionType, Json } from "@/types/database";
import type { DesignTokens } from "@/lib/branding/tokens";
import type { BrandDNA } from "@/lib/experience/types";

export type PublicCardSection = {
  id: string;
  type: CardSectionType;
  sort_order: number;
  enabled: boolean;
  config_json: Json;
};

export type PublicCardMarque = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
};

export type PublicCardViewModel = {
  organisation: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    whiteLabelEnabled: boolean;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    logoUrl: string | null;
  } | null;
  /** Vehicle marques represented on this card (from employee/location assignments). */
  marques: PublicCardMarque[];
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
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    jobTitle: string | null;
    department: string | null;
    email: string | null;
    mobile: string | null;
    whatsapp: string | null;
    linkedinUrl: string | null;
    profilePhotoUrl: string | null;
    bio: string | null;
  };
  card: {
    id: string;
    slug: string;
    layoutId: CardLayoutId;
    pageTitle: string | null;
    metaDescription: string | null;
    primaryCtaLabel: string | null;
    primaryCtaUrl: string | null;
    publicStatus: string;
    publicPath: string;
  };
  sections: PublicCardSection[];
  tokens: DesignTokens;
  brandDNA: BrandDNA;
};

export const DEFAULT_CARD_SECTION_ORDER: CardSectionType[] = [
  "hero",
  "contact_actions",
  "about",
  "social_links",
];
