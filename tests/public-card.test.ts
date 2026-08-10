import { describe, expect, it } from "vitest";
import {
  assertPublicCardTenantMatch,
  parsePublicCardPayload,
  resolvePublicCardTokens,
  toPublicCardViewModel,
} from "@/lib/cards/public-card";
import { platformDefaultTokens } from "@/lib/branding/tokens";
import type { Json } from "@/types/database";

const samplePayload = {
  card: {
    id: "card-1",
    slug: "jane-doe",
    layout_id: "modern" as const,
    page_title: "Jane Doe",
    meta_description: "Head of Partnerships",
    primary_cta_label: "Book a meeting",
    primary_cta_url: "https://example.com/book",
    public_status: "active",
  },
  organisation: {
    id: "org-1",
    name: "Acme",
    slug: "acme",
    website: "https://acme.example",
    white_label_enabled: true,
  },
  employee: {
    id: "emp-1",
    first_name: "Jane",
    last_name: "Doe",
    display_name: "Jane Doe",
    job_title: "Head of Partnerships",
    department: null,
    email: "jane@acme.example",
    mobile: "+15551234567",
    whatsapp: "+15551234567",
    linkedin_url: "https://linkedin.com/in/jane",
    profile_photo_url: null,
    bio: "Hello",
  },
  brand: {
    id: "brand-1",
    name: "Acme Mobility",
    slug: "mobility",
    website: null,
    logo_url: null,
  },
  location: null,
  marques: [
    {
      id: "marque-geely",
      name: "Geely",
      slug: "geely",
      website: null,
      logo_url: null,
    },
    {
      id: "marque-mg",
      name: "MG",
      slug: "mg",
      website: null,
      logo_url: null,
    },
  ],
  organisation_kit: {
    id: "kit-org",
    organisation_id: "org-1",
    brand_id: null,
    name: "Organisation default",
    primary_colour: "#112233",
    secondary_colour: "#223344",
    accent_colour: "#334455",
    background_colour: "#F7F7F7",
    surface_colour: "#FFFFFF",
    text_colour: "#111111",
    muted_text_colour: "#666666",
    heading_font: "Sora",
    body_font: "Manrope",
    button_radius: "12px",
    card_radius: "20px",
    border_style: "subtle",
    shadow_style: "soft",
    background_style: "solid",
    logo_url: null,
    default_layout_id: "corporate" as const,
    custom_css_allowed: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  brand_kit: {
    id: "kit-brand",
    organisation_id: "org-1",
    brand_id: "brand-1",
    name: "Mobility kit",
    primary_colour: "#AA0000",
    secondary_colour: "#880000",
    accent_colour: "#FFAA00",
    background_colour: "#FFF8F8",
    surface_colour: "#FFFFFF",
    text_colour: "#220000",
    muted_text_colour: "#774444",
    heading_font: "Outfit",
    body_font: "Source Sans 3",
    button_radius: "16px",
    card_radius: "28px",
    border_style: "subtle",
    shadow_style: "soft",
    background_style: "solid",
    logo_url: "https://example.com/logo.png",
    default_layout_id: "modern" as const,
    custom_css_allowed: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  card_kit: null,
  sections: [
    {
      id: "sec-1",
      type: "hero" as const,
      sort_order: 0,
      enabled: true,
      config_json: {},
    },
  ],
};

describe("public card resolver", () => {
  it("parses payload and resolves brand inheritance over organisation defaults", () => {
    const parsed = parsePublicCardPayload(samplePayload as unknown as Json);
    expect(parsed).not.toBeNull();
    const tokens = resolvePublicCardTokens(parsed!);
    expect(tokens.primary).toBe("#AA0000");
    expect(tokens.background).toBe("#FFF8F8");
    expect(tokens.primary).not.toBe(platformDefaultTokens.primary);

    const view = toPublicCardViewModel(parsed!);
    expect(view.card.publicPath).toBe("/acme/jane-doe");
    expect(view.card.layoutId).toBe("modern");
    expect(view.tokens.logoUrl).toBe("https://example.com/logo.png");
    expect(view.brandDNA.tokens.primary).toBe("#AA0000");
    expect(view.brandDNA.experience.preset).toBeNull();
    expect(view.marques.map((m) => m.slug)).toEqual(["geely", "mg"]);
    expect(assertPublicCardTenantMatch(view, "acme", "jane-doe")).toBe(true);
    expect(assertPublicCardTenantMatch(view, "other-org", "jane-doe")).toBe(
      false,
    );
  });

  it("returns null for empty payloads (no cross-tenant inventing)", () => {
    expect(parsePublicCardPayload(null)).toBeNull();
    expect(parsePublicCardPayload({})).toBeNull();
  });
});
