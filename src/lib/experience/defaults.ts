import type {
  BrandVisualDNA,
  ExperienceConfig,
  ExperiencePresetId,
} from "@/lib/experience/types";

export const platformVisualDNA: BrandVisualDNA = {
  visualPersonality: "corporate",
  surfaceStyle: "solid",
  backgroundStyle: "solid",
  geometryStyle: "soft",
  imageTreatment: "circle",
  borderStyle: "subtle",
  cornerStyle: "rounded",
};

export const platformExperienceConfig: ExperienceConfig = {
  preset: null,
  depth: 0.35,
  tiltStrength: 0,
  parallaxStrength: 0,
  reflectionStrength: 0.2,
  ambientMotion: false,
  transitionStyle: "fade",
  revealStyle: "fade",
  interactionIntensity: 0.3,
  particleIntensity: 0,
  logoTreatment: "plain",
  profileTreatment: "circle",
  environmentTone: "soft-light",
  chromaticIntensity: 0.25,
  allowWebGL: false,
  allowAdvancedEffects: false,
  reducedMotionFallback: "essential",
};

/**
 * Dimension preset — chromatic smoked acrylic object in a studio-dark field.
 * Brand colours express as refraction / edge light, not filled UI panels.
 */
export const dimensionExperienceConfig: ExperienceConfig = {
  preset: "dimension",
  depth: 0.85,
  tiltStrength: 0.55,
  parallaxStrength: 0.55,
  reflectionStrength: 0.72,
  ambientMotion: true,
  transitionStyle: "rise",
  revealStyle: "stagger",
  interactionIntensity: 0.65,
  particleIntensity: 0,
  logoTreatment: "embedded",
  profileTreatment: "integrated",
  environmentTone: "studio-dark",
  chromaticIntensity: 0.55,
  allowWebGL: false,
  allowAdvancedEffects: true,
  reducedMotionFallback: "essential",
};

export const dimensionVisualDNA: BrandVisualDNA = {
  visualPersonality: "cinematic",
  surfaceStyle: "smoked-acrylic",
  backgroundStyle: "studio",
  geometryStyle: "sharp",
  imageTreatment: "integrated",
  borderStyle: "iridescent",
  cornerStyle: "precision",
};

export function presetExperienceConfig(
  preset: ExperiencePresetId | null,
): ExperienceConfig {
  if (preset === "dimension") return { ...dimensionExperienceConfig };
  if (preset === "minimal-motion") {
    return {
      ...platformExperienceConfig,
      preset: "minimal-motion",
      tiltStrength: 0,
      parallaxStrength: 0,
      ambientMotion: false,
      allowAdvancedEffects: false,
    };
  }
  return { ...platformExperienceConfig, preset };
}
