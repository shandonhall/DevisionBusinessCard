import { type CSSProperties } from "react";
import type { BrandKit, CardLayoutId } from "@/types/database";

/**
 * Platform default design tokens.
 * Never hard-code client-specific values — resolve via inheritance.
 */
export type DesignTokens = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: string;
  cardRadius: string;
  logoUrl: string | null;
  layoutId: CardLayoutId;
};

export const platformDefaultTokens: DesignTokens = {
  primary: "#0F766E",
  secondary: "#134E4A",
  accent: "#D97706",
  background: "#F4F7F5",
  surface: "#FFFFFF",
  text: "#14201C",
  mutedText: "#3F4D47",
  headingFont: "Outfit",
  bodyFont: "Source Sans 3",
  buttonRadius: "14px",
  cardRadius: "24px",
  logoUrl: null,
  layoutId: "corporate",
};

export const FONT_OPTIONS = [
  "Outfit",
  "Source Sans 3",
  "DM Sans",
  "Sora",
  "Manrope",
  "Space Grotesk",
] as const;

export const LAYOUT_OPTIONS: { id: CardLayoutId; label: string }[] = [
  { id: "executive", label: "Executive" },
  { id: "corporate", label: "Corporate" },
  { id: "modern", label: "Modern" },
];

export type TokenOverrides = Partial<DesignTokens>;

/**
 * Inheritance: platform → organisation kit → brand kit → location → card
 * Milestone 2 wires platform + organisation (default brand kit).
 */
export function resolveDesignTokens(layers: {
  organisationKit?: Partial<DesignTokens> | null;
  brandKit?: Partial<DesignTokens> | null;
  locationOverrides?: TokenOverrides | null;
  cardOverrides?: TokenOverrides | null;
}): DesignTokens {
  return {
    ...platformDefaultTokens,
    ...(layers.organisationKit ?? {}),
    ...(layers.brandKit ?? {}),
    ...(layers.locationOverrides ?? {}),
    ...(layers.cardOverrides ?? {}),
  };
}

export function brandKitToTokenPartial(
  kit: Pick<
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
  > | null
  | undefined,
): Partial<DesignTokens> | null {
  if (!kit) return null;
  return {
    primary: kit.primary_colour,
    secondary: kit.secondary_colour,
    accent: kit.accent_colour,
    background: kit.background_colour,
    surface: kit.surface_colour,
    text: kit.text_colour,
    mutedText: kit.muted_text_colour,
    headingFont: kit.heading_font,
    bodyFont: kit.body_font,
    buttonRadius: kit.button_radius,
    cardRadius: kit.card_radius,
    logoUrl: kit.logo_url,
    layoutId: kit.default_layout_id,
  };
}

export function tokensToCssVars(
  tokens: DesignTokens = platformDefaultTokens,
): CSSProperties {
  return {
    "--brand-primary": tokens.primary,
    "--brand-secondary": tokens.secondary,
    "--brand-accent": tokens.accent,
    "--brand-background": tokens.background,
    "--brand-surface": tokens.surface,
    "--brand-text": tokens.text,
    "--brand-muted-text": tokens.mutedText,
    "--brand-button-radius": tokens.buttonRadius,
    "--brand-card-radius": tokens.cardRadius,
    "--brand-heading-font": `"${tokens.headingFont}", var(--font-heading), sans-serif`,
    "--brand-body-font": `"${tokens.bodyFont}", var(--font-body), sans-serif`,
  } as CSSProperties;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastWarnings(tokens: DesignTokens): string[] {
  const warnings: string[] = [];
  const textOnBg = contrastRatio(tokens.text, tokens.background);
  if (textOnBg !== null && textOnBg < 4.5) {
    warnings.push(
      `Text on background contrast is ${textOnBg.toFixed(2)}:1 (aim for 4.5:1).`,
    );
  }
  const primaryOnBg = contrastRatio(tokens.primary, tokens.background);
  if (primaryOnBg !== null && primaryOnBg < 3) {
    warnings.push(
      `Primary on background contrast is ${primaryOnBg.toFixed(2)}:1 (aim for 3:1 for UI).`,
    );
  }
  return warnings;
}
