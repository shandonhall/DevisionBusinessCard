import {
  hexToRgb,
  type ApplePassContent,
  type ApplePassField,
} from "@/lib/wallet/apple-pass-content";
import type { DesignTokens } from "@/lib/branding/tokens";

/**
 * WalletWallet signs Apple Wallet passes with its own certificate, so cards
 * can offer Add to Apple Wallet before we have an Apple Developer account.
 * https://walletwallet.dev - free plan: preset colours, no logo or photo.
 */
const ENDPOINT = "https://api.walletwallet.dev/api/pkpass";

export type WalletWalletColorPreset =
  | "dark"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange";

type WalletWalletField = { label?: string; value: string };

export class WalletWalletError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function toField({ label, value, link }: ApplePassField): WalletWalletField {
  const text = link ? link.href : value;
  return label
    ? { label: clip(label, 64), value: clip(text, 256) }
    : { value: clip(text, 256) };
}

function hue({ r, g, b }: { r: number; g: number; b: number }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness: max / 255 };
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return {
    hue: (h * 60 + 360) % 360,
    saturation: delta / max,
    lightness: max / 255,
  };
}

/** Closest free-plan preset to the card's brand colour. */
export function nearestColorPreset(tokens: DesignTokens): WalletWalletColorPreset {
  const surface = hexToRgb(tokens.surface);
  if (surface && hue(surface).lightness < 0.35) return "dark";
  const primary = hexToRgb(tokens.primary);
  if (!primary) return "dark";
  const { hue: h, saturation } = hue(primary);
  if (saturation < 0.25) return "dark";
  if (h < 20 || h >= 340) return "red";
  if (h < 75) return "orange";
  if (h < 190) return "green";
  if (h < 260) return "blue";
  return "purple";
}

export function buildWalletWalletBody(
  content: ApplePassContent,
  tokens: DesignTokens,
) {
  return {
    logoText: clip(content.organizationName, 64),
    organizationName: clip(content.organizationName, 64),
    description: clip(content.description, 128),
    colorPreset: nearestColorPreset(tokens),
    headerFields: content.headerFields.map(toField),
    primaryFields: content.primaryFields.map(toField),
    secondaryFields: content.secondaryFields.map(toField),
    backFields: content.backFields.map(toField),
    barcodeValue: content.barcode.message,
    barcodeFormat: "QR",
    barcodeAltText: content.barcode.altText,
    sharingProhibited: false,
  };
}

export async function createWalletWalletPass(
  body: ReturnType<typeof buildWalletWalletBody>,
  apiKey: string,
): Promise<Buffer> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new WalletWalletError(
      `WalletWallet responded ${response.status}: ${detail.slice(0, 200)}`,
      response.status,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}
