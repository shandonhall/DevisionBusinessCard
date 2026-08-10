import { describe, expect, it } from "vitest";
import { resolveDriveMarqueId } from "@/lib/experience/drive-marque";
import {
  parsePublicCardPayload,
  toPublicCardViewModel,
} from "@/lib/cards/public-card";
import type { Json } from "@/types/database";

describe("resolveDriveMarqueId", () => {
  it("returns agg when no vehicle marques", () => {
    expect(resolveDriveMarqueId([])).toBe("agg");
    expect(resolveDriveMarqueId([{ slug: "agg-motors" }])).toBe("agg");
  });

  it("returns the single vehicle marque", () => {
    expect(resolveDriveMarqueId([{ slug: "geely" }])).toBe("geely");
    expect(resolveDriveMarqueId([{ slug: "jetour" }])).toBe("jetour");
    expect(resolveDriveMarqueId([{ slug: "mg" }])).toBe("mg");
    expect(resolveDriveMarqueId([{ slug: "jac" }])).toBe("jac");
  });

  it("returns agg when multiple vehicle marques", () => {
    expect(
      resolveDriveMarqueId([{ slug: "geely" }, { slug: "mg" }]),
    ).toBe("agg");
  });
});

describe("drive marque view model", () => {
  const base = {
    card: {
      id: "c1",
      slug: "demo-alex-morgan",
      layout_id: "modern" as const,
      page_title: "Demo",
      meta_description: null,
      primary_cta_label: null,
      primary_cta_url: null,
      public_status: "draft",
    },
    organisation: {
      id: "o1",
      name: "AGG Motors",
      slug: "agg",
      website: "https://www.agg.co.za",
      white_label_enabled: true,
    },
    employee: {
      id: "e1",
      first_name: "Alex",
      last_name: "Morgan",
      display_name: "Alex Morgan",
      job_title: "Sales Executive",
      department: null,
      email: "demo@example.local",
      mobile: null,
      whatsapp: null,
      linkedin_url: null,
      profile_photo_url: null,
      bio: null,
    },
    brand: null,
    location: {
      id: "l1",
      name: "AGG Northcliff",
      slug: "northcliff",
      type: "dealership",
      address: null,
      phone: null,
      email: null,
      website: null,
    },
    organisation_kit: {
      id: "k1",
      organisation_id: "o1",
      brand_id: null,
      name: "AGG Drive",
      primary_colour: "#2D3E40",
      secondary_colour: "#1A2628",
      accent_colour: "#C9A962",
      background_colour: "#07090B",
      surface_colour: "#12161A",
      text_colour: "#F2F0EB",
      muted_text_colour: "#9AA6A8",
      heading_font: "Montserrat",
      body_font: "Poppins",
      button_radius: "6px",
      card_radius: "12px",
      border_style: "subtle",
      shadow_style: "soft",
      background_style: "solid",
      logo_url: "/brands/agg/agg-logo.png",
      default_layout_id: "modern" as const,
      custom_css_allowed: false,
      experience_preset: "drive",
      experience_config: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    brand_kit: null,
    card_kit: null,
    sections: [],
  };

  it("applies geely drive marque for a single-marque employee", () => {
    const payload = parsePublicCardPayload({
      ...base,
      marques: [
        {
          id: "b1",
          name: "Geely",
          slug: "geely",
          website: null,
          logo_url: null,
        },
      ],
    } as unknown as Json);
    const view = toPublicCardViewModel(payload!);
    expect(view.brandDNA.driveMarque).toBe("geely");
    expect(view.tokens.accent).toBe("#6FA8C9");
    expect(view.tokens.logoUrl).toContain("geely");
  });

  it("falls back to agg for multi-marque employees", () => {
    const payload = parsePublicCardPayload({
      ...base,
      marques: [
        { id: "1", name: "Geely", slug: "geely", website: null, logo_url: null },
        { id: "2", name: "MG", slug: "mg", website: null, logo_url: null },
      ],
    } as unknown as Json);
    const view = toPublicCardViewModel(payload!);
    expect(view.brandDNA.driveMarque).toBe("agg");
    expect(view.tokens.accent).toBe("#C9A962");
  });
});
