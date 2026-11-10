import { contrastRatio, type DesignTokens } from "@/lib/branding/tokens";
import type { PublicCardViewModel } from "@/types/card";

export type ApplePassField = {
  key: string;
  label?: string;
  value: string;
  attributedValue?: string;
};

export type ApplePassColours = {
  background: string;
  foreground: string;
  label: string;
};

export type ApplePassContent = {
  serialNumber: string;
  description: string;
  organizationName: string;
  logoText?: string;
  colours: ApplePassColours;
  headerFields: ApplePassField[];
  primaryFields: ApplePassField[];
  secondaryFields: ApplePassField[];
  auxiliaryFields: ApplePassField[];
  backFields: ApplePassField[];
  barcode: { message: string; altText: string };
};

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = HEX.exec(hex.trim());
  if (!match?.[1]) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Wallet only accepts `rgb(r, g, b)` colour strings. */
export function toPassRgb(hex: string): string {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function normaliseHex(hex: string | null | undefined, fallback: string) {
  const match = hex ? HEX.exec(hex.trim()) : null;
  return match?.[1] ? `#${match[1].toUpperCase()}` : fallback;
}

/**
 * Uses the card surface so logos drawn for that surface stay legible,
 * then picks readable text and an on-brand label colour.
 */
export function resolvePassColours(tokens: DesignTokens): ApplePassColours {
  const background = normaliseHex(tokens.surface, "#FFFFFF");
  const text = normaliseHex(tokens.text, "#111111");
  const readable = (colour: string, minimum: number) =>
    (contrastRatio(colour, background) ?? 0) >= minimum;

  const foreground = readable(text, 4.5)
    ? text
    : (contrastRatio("#FFFFFF", background) ?? 0) >=
        (contrastRatio("#111111", background) ?? 0)
      ? "#FFFFFF"
      : "#111111";

  const label =
    [tokens.accent, tokens.primary, tokens.mutedText]
      .map((colour) => normaliseHex(colour, ""))
      .find((colour) => colour && readable(colour, 3)) ?? foreground;

  return { background, foreground, label };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function link(href: string, text: string) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function absoluteHttpUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostLabel(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Maps a public card onto Apple's generic pass layout.
 * Front fields are not tappable on iPhone; every action lives on the back,
 * where Wallet turns phone numbers, emails, addresses and links into taps.
 */
export function buildApplePassContent(
  model: PublicCardViewModel,
  options: {
    cardUrl: string;
    hasLogoImage: boolean;
    platformName: string;
  },
): ApplePassContent {
  const { employee, location, organisation } = model;
  const company = model.brand?.name || organisation.name;
  const website = model.brand?.website || organisation.website;

  const secondaryFields: ApplePassField[] = [];
  if (employee.jobTitle) {
    secondaryFields.push({ key: "role", label: "Role", value: employee.jobTitle });
  }
  secondaryFields.push({ key: "company", label: "Company", value: company });

  const auxiliaryFields: ApplePassField[] = [];
  if (employee.mobile) {
    auxiliaryFields.push({ key: "mobile", label: "Mobile", value: employee.mobile });
  }
  if (employee.email) {
    auxiliaryFields.push({ key: "email", label: "Email", value: employee.email });
  }

  const backFields: ApplePassField[] = [];
  if (employee.mobile) {
    backFields.push({ key: "back-mobile", label: "Mobile", value: employee.mobile });
  }
  if (employee.whatsapp) {
    const href = `https://wa.me/${employee.whatsapp.replace(/\D/g, "")}`;
    backFields.push({
      key: "back-whatsapp",
      label: "WhatsApp",
      value: employee.whatsapp,
      attributedValue: link(href, "Message on WhatsApp"),
    });
  }
  if (employee.email) {
    backFields.push({ key: "back-email", label: "Email", value: employee.email });
  }
  if (website) {
    const href = absoluteHttpUrl(website);
    backFields.push({
      key: "back-website",
      label: "Website",
      value: href,
      attributedValue: link(href, hostLabel(href)),
    });
  }
  if (employee.linkedinUrl) {
    const href = absoluteHttpUrl(employee.linkedinUrl);
    backFields.push({
      key: "back-linkedin",
      label: "LinkedIn",
      value: href,
      attributedValue: link(href, "View LinkedIn profile"),
    });
  }
  if (location) {
    backFields.push({
      key: "back-location",
      label: location.name,
      value: location.address || location.name,
    });
    if (location.phone) {
      backFields.push({
        key: "back-location-phone",
        label: `${location.name} phone`,
        value: location.phone,
      });
    }
  }
  backFields.push({
    key: "back-card",
    label: "Digital business card",
    value: options.cardUrl,
    attributedValue: link(options.cardUrl, "Open the full card"),
  });
  if (employee.bio) {
    backFields.push({ key: "back-about", label: "About", value: employee.bio });
  }
  if (!organisation.whiteLabelEnabled) {
    backFields.push({
      key: "back-platform",
      label: "Digital card by",
      value: options.platformName,
    });
  }

  return {
    serialNumber: model.card.id,
    description: `${employee.displayName} - ${company} business card`,
    organizationName: company,
    logoText: options.hasLogoImage ? undefined : company,
    colours: resolvePassColours(model.tokens),
    headerFields: location
      ? [{ key: "location", label: "Location", value: location.name }]
      : [],
    primaryFields: [{ key: "name", value: employee.displayName }],
    secondaryFields,
    auxiliaryFields,
    backFields,
    barcode: {
      message: options.cardUrl,
      altText: "Scan to open card",
    },
  };
}
