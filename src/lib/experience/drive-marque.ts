import type { DesignTokens } from "@/lib/branding/tokens";
import type { BrandVisualDNA, ExperienceConfig } from "@/lib/experience/types";
import { driveExperienceConfig, driveVisualDNA } from "@/lib/experience/defaults";

/**
 * Drive marque identity - visual expression within the shared Drive engine.
 * Never branch on organisation.name; resolve from employee marque assignments.
 */
export type DriveMarqueId = "agg" | "geely" | "jetour" | "mg" | "jac";

export type DriveMarqueConfig = {
  id: DriveMarqueId;
  label: string;
  /** Brand website used as visual source of truth (not hotlinked). */
  sourceUrl: string;
  logoPath: string;
  /**
   * When set, Drive renders this as crisp on-page typography instead of a
   * raster/SVG image (avoids noisy converted lockups).
   */
  wordmark?: string;
  /** Google Fonts-safe fallbacks matching brand character. */
  headingFont: string;
  bodyFont: string;
  fontNote: string;
  website: string;
  tokens: Pick<
    DesignTokens,
    | "primary"
    | "secondary"
    | "accent"
    | "background"
    | "surface"
    | "text"
    | "mutedText"
  >;
  visual: Partial<BrandVisualDNA>;
  experience: Partial<ExperienceConfig>;
  /** Tagline under the dock - marque-neutral or brand-fitting. */
  taglineHtml: { lead: string; strongA: string; mid: string; strongB: string };
};

const CORPORATE_SLUGS = new Set(["agg-motors", "agg"]);

export const DRIVE_MARQUE_CONFIGS: Record<DriveMarqueId, DriveMarqueConfig> = {
  agg: {
    id: "agg",
    label: "AGG Motors",
    sourceUrl: "https://www.agg.co.za/",
    logoPath: "/brands/agg/agg-logo.png",
    headingFont: "Montserrat",
    bodyFont: "Poppins",
    fontNote: "Matches AGG site (Montserrat headings, Poppins body).",
    website: "https://www.agg.co.za/",
    tokens: {
      primary: "#2D3E40",
      secondary: "#1A2628",
      accent: "#C9A962",
      background: "#06080A",
      surface: "#12161A",
      text: "#F2F0EB",
      mutedText: "#9AA6A8",
    },
    visual: { ...driveVisualDNA },
    experience: { ...driveExperienceConfig },
    taglineHtml: {
      lead: "Driven by",
      strongA: "trust",
      mid: ". Defined by",
      strongB: "service",
    },
  },
  geely: {
    id: "geely",
    label: "Geely",
    sourceUrl: "https://geelynorthcliff.co.za/",
    logoPath: "/brands/marques/geely-logo.png",
    headingFont: "Montserrat",
    bodyFont: "Poppins",
    fontNote:
      "Logo from geelynorthcliff.co.za (local copy). Montserrat/Poppins keep Drive consistency.",
    website: "https://www.geelyauto.co.za/",
    tokens: {
      primary: "#0B1C2C",
      secondary: "#16324A",
      accent: "#6FA8C9",
      background: "#050A10",
      surface: "#0E1822",
      text: "#E8EEF4",
      mutedText: "#8FA3B5",
    },
    visual: {
      visualPersonality: "minimal",
      surfaceStyle: "graphite-lacquer",
      backgroundStyle: "studio",
      geometryStyle: "soft",
      imageTreatment: "integrated",
      borderStyle: "subtle",
      cornerStyle: "rounded",
    },
    experience: {
      ...driveExperienceConfig,
      chromaticIntensity: 0.18,
      reflectionStrength: 0.7,
      tiltStrength: 0.42,
      environmentTone: "studio-dark",
    },
    taglineHtml: {
      lead: "Innovation in",
      strongA: "motion",
      mid: ". Refined by",
      strongB: "design",
    },
  },
  jetour: {
    id: "jetour",
    label: "Jetour",
    sourceUrl: "https://jetour.co.za/",
    logoPath: "/brands/marques/jetour-logo.png",
    wordmark: "JETOUR",
    headingFont: "Montserrat",
    bodyFont: "Poppins",
    fontNote:
      "Jetour badge uses crisp on-page Montserrat wordmark (noisy raster lockup avoided).",
    website: "https://jetour.co.za/",
    tokens: {
      primary: "#0A0A0A",
      secondary: "#1A1A1A",
      accent: "#C47A3A",
      background: "#050505",
      surface: "#121212",
      text: "#F5F5F5",
      mutedText: "#A3A3A3",
    },
    visual: {
      visualPersonality: "cinematic",
      surfaceStyle: "graphite-lacquer",
      backgroundStyle: "studio",
      geometryStyle: "sharp",
      imageTreatment: "integrated",
      borderStyle: "subtle",
      cornerStyle: "precision",
    },
    experience: {
      ...driveExperienceConfig,
      chromaticIntensity: 0.22,
      reflectionStrength: 0.58,
      tiltStrength: 0.52,
      interactionIntensity: 0.6,
    },
    taglineHtml: {
      lead: "Fortune favours the",
      strongA: "bold",
      mid: ". Built for",
      strongB: "adventure",
    },
  },
  mg: {
    id: "mg",
    label: "MG",
    sourceUrl: "https://mgmotor.co.za/",
    logoPath: "/brands/marques/mg-mark.png",
    headingFont: "Montserrat",
    bodyFont: "Poppins",
    fontNote:
      "MG SA uses contemporary sans; Montserrat/Poppins retain Drive unity. Octagon mark from approved local asset.",
    website: "https://mgmotor.co.za/",
    tokens: {
      primary: "#111111",
      secondary: "#1C1C1C",
      accent: "#DD1D21",
      background: "#070707",
      surface: "#141414",
      text: "#F7F7F7",
      mutedText: "#A8A8A8",
    },
    visual: {
      visualPersonality: "corporate",
      surfaceStyle: "graphite-lacquer",
      backgroundStyle: "studio",
      geometryStyle: "sharp",
      imageTreatment: "integrated",
      borderStyle: "subtle",
      cornerStyle: "precision",
    },
    experience: {
      ...driveExperienceConfig,
      chromaticIntensity: 0.32,
      reflectionStrength: 0.55,
      tiltStrength: 0.46,
    },
    taglineHtml: {
      lead: "Exceed",
      strongA: "expectation",
      mid: ". Driven by",
      strongB: "spirit",
    },
  },
  jac: {
    id: "jac",
    label: "JAC",
    sourceUrl: "https://jacmotors.co.za/",
    logoPath: "/brands/marques/jac-mark.png",
    headingFont: "Montserrat",
    bodyFont: "Poppins",
    fontNote:
      "JAC SA is pragmatic industrial sans; Montserrat/Poppins approximate. Red/black from JAC Group digital identity.",
    website: "https://jacmotors.co.za/",
    tokens: {
      primary: "#231714",
      secondary: "#3A2A24",
      accent: "#CC000D",
      background: "#080606",
      surface: "#161210",
      text: "#F4F0EE",
      mutedText: "#A89890",
    },
    visual: {
      visualPersonality: "corporate",
      surfaceStyle: "graphite-lacquer",
      backgroundStyle: "studio",
      geometryStyle: "sharp",
      imageTreatment: "integrated",
      borderStyle: "subtle",
      cornerStyle: "rounded",
    },
    experience: {
      ...driveExperienceConfig,
      chromaticIntensity: 0.26,
      reflectionStrength: 0.5,
      tiltStrength: 0.44,
      ambientMotion: true,
    },
    taglineHtml: {
      lead: "Think &",
      strongA: "create",
      mid: ". Built to",
      strongB: "work",
    },
  },
};

export function isVehicleMarqueSlug(slug: string): boolean {
  return !CORPORATE_SLUGS.has(slug);
}

/**
 * Business rule: exactly one vehicle marque → that Drive identity;
 * zero or multiple → AGG master / fallback.
 */
export function resolveDriveMarqueId(
  marques: Array<{ slug: string }>,
): DriveMarqueId {
  const vehicle = marques.filter((m) => isVehicleMarqueSlug(m.slug));
  if (vehicle.length === 1) {
    const slug = vehicle[0]?.slug;
    if (slug === "geely" || slug === "jetour" || slug === "mg" || slug === "jac") {
      return slug;
    }
  }
  return "agg";
}

export function getDriveMarqueConfig(id: DriveMarqueId): DriveMarqueConfig {
  return DRIVE_MARQUE_CONFIGS[id];
}

export function applyDriveMarqueToTokens(
  tokens: DesignTokens,
  marque: DriveMarqueId,
): DesignTokens {
  const config = getDriveMarqueConfig(marque);
  return {
    ...tokens,
    ...config.tokens,
    headingFont: config.headingFont,
    bodyFont: config.bodyFont,
    logoUrl: config.logoPath,
  };
}
