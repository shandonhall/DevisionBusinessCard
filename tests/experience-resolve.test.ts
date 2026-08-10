import { describe, expect, it } from "vitest";
import { platformDefaultTokens } from "@/lib/branding/tokens";
import {
  resolveBrandDNA,
  shouldUseDimensionExperience,
} from "@/lib/experience/resolve";

describe("resolveBrandDNA", () => {
  it("defaults to legacy (no dimension) without presets", () => {
    const dna = resolveBrandDNA({ tokens: platformDefaultTokens });
    expect(dna.experience.preset).toBeNull();
    expect(shouldUseDimensionExperience(dna, "full")).toBe(false);
    expect(dna.tokens.primary).toBe(platformDefaultTokens.primary);
  });

  it("inherits dimension from brand kit over organisation kit", () => {
    const dna = resolveBrandDNA({
      tokens: { ...platformDefaultTokens, primary: "#FF6900" },
      organisationKit: { experience_preset: "minimal-motion" },
      brandKit: { experience_preset: "dimension" },
    });
    expect(dna.experience.preset).toBe("dimension");
    expect(dna.experience.tiltStrength).toBeGreaterThan(0);
    expect(dna.visual.surfaceStyle).toBe("smoked-acrylic");
    expect(dna.experience.environmentTone).toBe("studio-dark");
    expect(shouldUseDimensionExperience(dna, "enhanced")).toBe(true);
    expect(shouldUseDimensionExperience(dna, "essential")).toBe(false);
  });

  it("never requires organisation name to select experience", () => {
    const dna = resolveBrandDNA({
      tokens: platformDefaultTokens,
      brandKit: {
        experience_preset: "dimension",
        experience_config: { tiltStrength: 0.4 },
      },
    });
    expect(dna.experience.preset).toBe("dimension");
    expect(dna.experience.tiltStrength).toBe(0.4);
  });
});
