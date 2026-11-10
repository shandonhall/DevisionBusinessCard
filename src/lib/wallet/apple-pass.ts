import sharp from "sharp";
import { PKPass, PassType } from "passkit-generator";
import type { PublicCardViewModel } from "@/types/card";
import type { AppleWalletConfig } from "@/lib/validation/env";
import { withAttribution } from "@/lib/analytics/source";
import {
  buildApplePassContent,
  hexToRgb,
  toPassRgb,
} from "@/lib/wallet/apple-pass-content";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SCALES = [1, 2, 3] as const;

type Rgb = { r: number; g: number; b: number };

function imageName(base: string, scale: (typeof SCALES)[number]) {
  return scale === 1 ? `${base}.png` : `${base}@${scale}x.png`;
}

async function fetchImage(url: string | null, origin: string) {
  if (!url) return null;
  try {
    const target = new URL(url, origin);
    if (target.protocol !== "https:" && target.protocol !== "http:") return null;
    const response = await fetch(target, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;
    await sharp(buffer).metadata();
    return buffer;
  } catch {
    return null;
  }
}

/** Wallet shows the logo top-left at up to 160x50pt. */
async function logoImages(source: Buffer) {
  const files: Record<string, Buffer> = {};
  for (const scale of SCALES) {
    files[imageName("logo", scale)] = await sharp(source)
      .resize({ width: 160 * scale, height: 50 * scale, fit: "inside" })
      .png()
      .toBuffer();
  }
  return files;
}

/** Lock-screen and notification icon, 29pt square. Required by Wallet. */
async function iconImages(source: Buffer | null, background: Rgb, foreground: Rgb) {
  const files: Record<string, Buffer> = {};
  for (const scale of SCALES) {
    const size = 29 * scale;
    if (source) {
      const inner = Math.round(size * 0.78);
      const pad = Math.floor((size - inner) / 2);
      files[imageName("icon", scale)] = await sharp(source)
        .resize(inner, inner, {
          fit: "contain",
          background: { ...background, alpha: 0 },
        })
        .extend({
          top: pad,
          bottom: size - inner - pad,
          left: pad,
          right: size - inner - pad,
          background: { ...background, alpha: 1 },
        })
        .flatten({ background })
        .png()
        .toBuffer();
      continue;
    }
    const fg = `rgb(${foreground.r},${foreground.g},${foreground.b})`;
    const bg = `rgb(${background.r},${background.g},${background.b})`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <rect x="${size * 0.18}" y="${size * 0.3}" width="${size * 0.64}" height="${size * 0.4}"
        rx="${size * 0.07}" fill="none" stroke="${fg}" stroke-width="${Math.max(1, size * 0.06)}"/>
    </svg>`;
    files[imageName("icon", scale)] = await sharp(Buffer.from(svg)).png().toBuffer();
  }
  return files;
}

/** Profile photo beside the name, 90pt square. */
async function thumbnailImages(source: Buffer) {
  const files: Record<string, Buffer> = {};
  for (const scale of SCALES) {
    const size = 90 * scale;
    files[imageName("thumbnail", scale)] = await sharp(source)
      .resize(size, size, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();
  }
  return files;
}

/**
 * Builds and signs a `.pkpass` for a public card. `assetOrigin` resolves
 * relative logo paths such as the Drive marque logos in /public.
 */
export async function createApplePass(
  model: PublicCardViewModel,
  options: {
    config: AppleWalletConfig;
    absoluteCardUrl: string;
    assetOrigin: string;
    platformName: string;
  },
): Promise<Buffer> {
  const [logo, photo] = await Promise.all([
    fetchImage(model.tokens.logoUrl ?? model.brand?.logoUrl ?? null, options.assetOrigin),
    fetchImage(model.employee.profilePhotoUrl, options.assetOrigin),
  ]);

  const content = buildApplePassContent(model, {
    cardUrl: withAttribution(options.absoluteCardUrl, "wallet"),
    hasLogoImage: Boolean(logo),
    platformName: options.platformName,
  });
  const background = hexToRgb(content.colours.background) ?? { r: 255, g: 255, b: 255 };
  const foreground = hexToRgb(content.colours.foreground) ?? { r: 17, g: 17, b: 17 };

  const buffers = {
    ...(await iconImages(logo, background, foreground)),
    ...(logo ? await logoImages(logo) : {}),
    ...(photo ? await thumbnailImages(photo) : {}),
  };

  const pass = new PKPass(
    buffers,
    {
      wwdr: options.config.wwdr,
      signerCert: options.config.signerCert,
      signerKey: options.config.signerKey,
      signerKeyPassphrase: options.config.signerKeyPassphrase,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: options.config.passTypeIdentifier,
      teamIdentifier: options.config.teamIdentifier,
      serialNumber: content.serialNumber,
      description: content.description,
      organizationName: content.organizationName,
      ...(content.logoText ? { logoText: content.logoText } : {}),
      backgroundColor: toPassRgb(content.colours.background),
      foregroundColor: toPassRgb(content.colours.foreground),
      labelColor: toPassRgb(content.colours.label),
      sharingProhibited: false,
    },
  );

  const generic = new PassType("generic");
  generic.headerFields.push(...content.headerFields);
  generic.primaryFields.push(...content.primaryFields);
  generic.secondaryFields.push(...content.secondaryFields);
  generic.auxiliaryFields.push(...content.auxiliaryFields);
  generic.backFields.push(...content.backFields);
  pass.types.push(generic);

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: content.barcode.message,
    messageEncoding: "iso-8859-1",
    altText: content.barcode.altText,
  });

  return pass.getAsBuffer();
}
