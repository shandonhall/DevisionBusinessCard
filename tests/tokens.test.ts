import { describe, expect, it } from "vitest";
import {
  brandKitToTokenPartial,
  contrastRatio,
  getContrastWarnings,
  platformDefaultTokens,
  resolveDesignTokens,
  tokensToCssVars,
} from "@/lib/branding/tokens";
import type { BrandKit } from "@/types/database";

describe("platform design tokens", () => {
  it("exposes CSS variables for runtime branding", () => {
    const vars = tokensToCssVars(platformDefaultTokens);
    expect(vars["--brand-primary" as keyof typeof vars]).toBe(
      platformDefaultTokens.primary,
    );
    expect(vars["--brand-card-radius" as keyof typeof vars]).toBe(
      platformDefaultTokens.cardRadius,
    );
  });
});

describe("token inheritance", () => {
  it("resolves platform → organisation → brand → location → card", () => {
    const resolved = resolveDesignTokens({
      organisationKit: { primary: "#111111" },
      brandKit: { accent: "#FF0000" },
      locationOverrides: { buttonRadius: "8px" },
      cardOverrides: { primary: "#00AA00" },
    });

    expect(resolved.primary).toBe("#00AA00");
    expect(resolved.accent).toBe("#FF0000");
    expect(resolved.buttonRadius).toBe("8px");
    expect(resolved.background).toBe(platformDefaultTokens.background);
  });

  it("maps a brand kit row into token overrides", () => {
    const kit = {
      primary_colour: "#ABCDEF",
      secondary_colour: "#123456",
      accent_colour: "#FEDCBA",
      background_colour: "#FFFFFF",
      surface_colour: "#F5F5F5",
      text_colour: "#000000",
      muted_text_colour: "#666666",
      heading_font: "Sora",
      body_font: "Manrope",
      button_radius: "10px",
      card_radius: "20px",
      logo_url: "https://example.com/logo.png",
      default_layout_id: "modern",
    } as Pick<
      BrandKit,
      | "primary_colour"
      | "secondary_colour"
      | "accent_colour"
      | "background_colour"
      | "surface_colour"
      | "text_colour"
      | "muted_text_colour"
      | "heading_font"
      | "body_font"
      | "button_radius"
      | "card_radius"
      | "logo_url"
      | "default_layout_id"
    >;

    const partial = brandKitToTokenPartial(kit);
    const resolved = resolveDesignTokens({ organisationKit: partial });
    expect(resolved.primary).toBe("#ABCDEF");
    expect(resolved.layoutId).toBe("modern");
    expect(resolved.logoUrl).toBe("https://example.com/logo.png");
  });
});

describe("contrast helpers", () => {
  it("computes contrast ratio and warns on low contrast", () => {
    const ratio = contrastRatio("#111111", "#FFFFFF");
    expect(ratio).toBeGreaterThan(10);

    const warnings = getContrastWarnings({
      ...platformDefaultTokens,
      text: "#EEEEEE",
      background: "#FFFFFF",
      primary: "#F5F5F5",
    });
    expect(warnings.length).toBeGreaterThan(0);
  });
});
