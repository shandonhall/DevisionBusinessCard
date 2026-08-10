import type { DesignTokens } from "@/lib/branding/tokens";
import type { Json } from "@/types/database";
import type { DriveMarqueId } from "@/lib/experience/drive-marque";

export type ExperiencePresetId =
  | "dimension"
  | "drive"
  | "precision"
  | "studio"
  | "glass"
  | "minimal-motion";

export type ExperienceQuality = "full" | "enhanced" | "essential";

export type VisualPersonality =
  | "creative"
  | "corporate"
  | "minimal"
  | "cinematic";

export type SurfaceStyle =
  | "glass"
  | "matte"
  | "layered"
  | "solid"
  | "smoked-acrylic"
  | "graphite-lacquer";
export type BackgroundStyle = "ambient" | "gradient" | "solid" | "mesh" | "studio";
export type GeometryStyle = "soft" | "sharp" | "organic";
export type ImageTreatment =
  | "framed"
  | "circle"
  | "layered"
  | "plain"
  | "integrated"
  | "monogram";
export type BorderStyle = "subtle" | "none" | "glow" | "iridescent";
export type CornerStyle = "soft" | "rounded" | "pill" | "precision";
export type EnvironmentTone = "studio-dark" | "soft-light" | "brand-wash";
export type LogoTreatment = "plain" | "glass" | "elevated" | "embedded";

export type ExperienceConfig = {
  preset: ExperiencePresetId | null;
  depth: number;
  tiltStrength: number;
  parallaxStrength: number;
  reflectionStrength: number;
  ambientMotion: boolean;
  transitionStyle: "rise" | "fade" | "none";
  revealStyle: "stagger" | "fade" | "none";
  interactionIntensity: number;
  particleIntensity: number;
  logoTreatment: LogoTreatment;
  profileTreatment: ImageTreatment;
  environmentTone: EnvironmentTone;
  chromaticIntensity: number;
  allowWebGL: boolean;
  allowAdvancedEffects: boolean;
  reducedMotionFallback: "essential" | "static";
};

export type BrandVisualDNA = {
  visualPersonality: VisualPersonality;
  surfaceStyle: SurfaceStyle;
  backgroundStyle: BackgroundStyle;
  geometryStyle: GeometryStyle;
  imageTreatment: ImageTreatment;
  borderStyle: BorderStyle;
  cornerStyle: CornerStyle;
};

export type BrandDNA = {
  tokens: DesignTokens;
  visual: BrandVisualDNA;
  experience: ExperienceConfig;
  /** Drive marque expression — only set when experience.preset === "drive". */
  driveMarque?: DriveMarqueId;
};

export type ExperienceKitPartial = {
  experience_preset?: string | null;
  experience_config?: Json | null;
  border_style?: string | null;
  shadow_style?: string | null;
  background_style?: string | null;
};
