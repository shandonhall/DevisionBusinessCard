import type { DesignTokens } from "@/lib/branding/tokens";
import {
  dimensionVisualDNA,
  platformExperienceConfig,
  platformVisualDNA,
  presetExperienceConfig,
} from "@/lib/experience/defaults";
import type {
  BrandDNA,
  BrandVisualDNA,
  ExperienceConfig,
  ExperienceKitPartial,
  ExperiencePresetId,
  ExperienceQuality,
} from "@/lib/experience/types";
import type { Json } from "@/types/database";

const PRESET_IDS: ExperiencePresetId[] = [
  "dimension",
  "precision",
  "studio",
  "glass",
  "minimal-motion",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePreset(raw: unknown): ExperiencePresetId | null {
  if (typeof raw !== "string") return null;
  return PRESET_IDS.includes(raw as ExperiencePresetId)
    ? (raw as ExperiencePresetId)
    : null;
}

function parseExperienceConfig(raw: Json | null | undefined): Partial<ExperienceConfig> {
  if (!isRecord(raw)) return {};
  const out: Partial<ExperienceConfig> = {};
  if (typeof raw.depth === "number") out.depth = raw.depth;
  if (typeof raw.tiltStrength === "number") out.tiltStrength = raw.tiltStrength;
  if (typeof raw.parallaxStrength === "number") {
    out.parallaxStrength = raw.parallaxStrength;
  }
  if (typeof raw.reflectionStrength === "number") {
    out.reflectionStrength = raw.reflectionStrength;
  }
  if (typeof raw.ambientMotion === "boolean") out.ambientMotion = raw.ambientMotion;
  if (typeof raw.interactionIntensity === "number") {
    out.interactionIntensity = raw.interactionIntensity;
  }
  if (typeof raw.particleIntensity === "number") {
    out.particleIntensity = raw.particleIntensity;
  }
  if (typeof raw.allowWebGL === "boolean") out.allowWebGL = raw.allowWebGL;
  if (typeof raw.allowAdvancedEffects === "boolean") {
    out.allowAdvancedEffects = raw.allowAdvancedEffects;
  }
  if (raw.transitionStyle === "rise" || raw.transitionStyle === "fade" || raw.transitionStyle === "none") {
    out.transitionStyle = raw.transitionStyle;
  }
  if (raw.revealStyle === "stagger" || raw.revealStyle === "fade" || raw.revealStyle === "none") {
    out.revealStyle = raw.revealStyle;
  }
  if (
    raw.logoTreatment === "plain" ||
    raw.logoTreatment === "glass" ||
    raw.logoTreatment === "elevated" ||
    raw.logoTreatment === "embedded"
  ) {
    out.logoTreatment = raw.logoTreatment;
  }
  if (
    raw.profileTreatment === "framed" ||
    raw.profileTreatment === "circle" ||
    raw.profileTreatment === "layered" ||
    raw.profileTreatment === "plain" ||
    raw.profileTreatment === "integrated" ||
    raw.profileTreatment === "monogram"
  ) {
    out.profileTreatment = raw.profileTreatment;
  }
  if (
    raw.environmentTone === "studio-dark" ||
    raw.environmentTone === "soft-light" ||
    raw.environmentTone === "brand-wash"
  ) {
    out.environmentTone = raw.environmentTone;
  }
  if (typeof raw.chromaticIntensity === "number") {
    out.chromaticIntensity = raw.chromaticIntensity;
  }
  if (raw.reducedMotionFallback === "essential" || raw.reducedMotionFallback === "static") {
    out.reducedMotionFallback = raw.reducedMotionFallback;
  }
  const preset = parsePreset(raw.preset);
  if (preset) out.preset = preset;
  return out;
}

function visualFromKit(kit: ExperienceKitPartial | null | undefined): Partial<BrandVisualDNA> {
  if (!kit) return {};
  const out: Partial<BrandVisualDNA> = {};
  if (kit.background_style === "solid") out.backgroundStyle = "solid";
  if (kit.background_style === "gradient") out.backgroundStyle = "gradient";
  if (kit.border_style === "subtle") out.borderStyle = "subtle";
  if (kit.border_style === "none") out.borderStyle = "none";
  return out;
}

function mergeExperience(
  base: ExperienceConfig,
  kit: ExperienceKitPartial | null | undefined,
): ExperienceConfig {
  if (!kit) return base;
  const preset = parsePreset(kit.experience_preset) ?? base.preset;
  const fromPreset = presetExperienceConfig(preset);
  const overrides = parseExperienceConfig(kit.experience_config);
  return {
    ...fromPreset,
    ...overrides,
    preset,
  };
}

/**
 * Resolve Brand DNA from design tokens + kit experience fields.
 * Inheritance: platform → organisation kit → brand kit → card kit.
 * Never branches on organisation name.
 */
export function resolveBrandDNA(params: {
  tokens: DesignTokens;
  organisationKit?: ExperienceKitPartial | null;
  brandKit?: ExperienceKitPartial | null;
  cardKit?: ExperienceKitPartial | null;
}): BrandDNA {
  let experience = { ...platformExperienceConfig };
  experience = mergeExperience(experience, params.organisationKit);
  experience = mergeExperience(experience, params.brandKit);
  experience = mergeExperience(experience, params.cardKit);

  let visual: BrandVisualDNA = { ...platformVisualDNA };
  if (experience.preset === "dimension") {
    visual = { ...dimensionVisualDNA };
  }
  visual = {
    ...visual,
    ...visualFromKit(params.organisationKit),
    ...visualFromKit(params.brandKit),
    ...visualFromKit(params.cardKit),
  };

  return {
    tokens: params.tokens,
    visual,
    experience,
  };
}

export function shouldUseDimensionExperience(
  dna: BrandDNA,
  quality: ExperienceQuality,
): boolean {
  if (dna.experience.preset !== "dimension") return false;
  if (quality === "essential") return false;
  return true;
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
