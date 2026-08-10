import { FONT_OPTIONS, type DesignTokens } from "@/lib/branding/tokens";

export type WebsiteBrandSuggestion = {
  sourceUrl: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  headingFont: string;
  bodyFont: string;
  logoUrl: string | null;
  layoutId: DesignTokens["layoutId"];
  notes: string[];
  coloursFound: string[];
};

type Rgb = { r: number; g: number; b: number };

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((c) => clampByte(c).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function normalizeColourToHex(raw: string): string | null {
  const value = raw.trim();

  const hex3 = /^#([0-9a-f]{3})$/i.exec(value);
  if (hex3?.[1]) {
    const [a, b, c] = hex3[1].split("");
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }

  const hex6 = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex6?.[1]) return `#${hex6[1].toUpperCase()}`;

  const hex8 = /^#([0-9a-f]{6})[0-9a-f]{2}$/i.exec(value);
  if (hex8?.[1]) return `#${hex8[1].toUpperCase()}`;

  const rgb =
    /^rgba?\(\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*[, ]\s*([0-9.]+)(?:\s*[,/]\s*[0-9.%]+)?\s*\)$/i.exec(
      value,
    );
  if (rgb) {
    return rgbToHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  }

  return null;
}

function hexToRgb(hex: string): Rgb | null {
  const match = /^#([0-9A-F]{6})$/i.exec(hex);
  if (!match?.[1]) return null;
  const v = match[1];
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function luminance(rgb: Rgb): number {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function saturation(rgb: Rgb): number {
  const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
  const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount,
  );
}

function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A || !B) return a;
  return rgbToHex(
    A.r + (B.r - A.r) * t,
    A.g + (B.g - A.g) * t,
    A.b + (B.b - A.b) * t,
  );
}

function absoluteUrl(base: string, href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return re.exec(tag)?.[1] ?? null;
}

function collectMetaContent(html: string, names: string[]): string[] {
  const out: string[] = [];
  const metaRe = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRe.exec(html))) {
    const tag = match[0];
    const name =
      attr(tag, "name") || attr(tag, "property") || attr(tag, "itemprop");
    if (!name) continue;
    if (!names.some((n) => n.toLowerCase() === name.toLowerCase())) continue;
    const content = attr(tag, "content");
    if (content) out.push(content);
  }
  return out;
}

function collectLinkHrefs(html: string, relIncludes: string[]): string[] {
  const out: string[] = [];
  const linkRe = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html))) {
    const tag = match[0];
    const rel = (attr(tag, "rel") || "").toLowerCase();
    if (!relIncludes.some((r) => rel.includes(r))) continue;
    const href = attr(tag, "href");
    if (href) out.push(href);
  }
  return out;
}

function extractStyleBlocks(html: string): string {
  const blocks: string[] = [];
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = styleRe.exec(html))) {
    blocks.push(match[1] ?? "");
  }
  return blocks.join("\n");
}

function extractColourCandidates(html: string): string[] {
  const found: string[] = [];
  const push = (raw: string) => {
    const hex = normalizeColourToHex(raw);
    if (hex) found.push(hex);
  };

  for (const content of collectMetaContent(html, [
    "theme-color",
    "msapplication-TileColor",
    "msapplication-navbutton-color",
  ])) {
    push(content);
  }

  const css = extractStyleBlocks(html);
  const haystack = `${css}\n${html}`;

  const varHints =
    /--(?:brand|primary|accent|secondary|color[-_]?primary|main[-_]?color|theme[-_]?color)\s*:\s*([^;}{]+)/gi;
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varHints.exec(haystack))) {
    push(varMatch[1].trim());
  }

  const hexRe = /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = hexRe.exec(haystack))) {
    push(hexMatch[0]);
  }

  const rgbRe =
    /rgba?\(\s*[0-9.]+\s*[, ]\s*[0-9.]+\s*[, ]\s*[0-9.]+(?:\s*[,/]\s*[0-9.%]+)?\s*\)/gi;
  let rgbMatch: RegExpExecArray | null;
  while ((rgbMatch = rgbRe.exec(haystack))) {
    push(rgbMatch[0]);
  }

  return found;
}

function rankColours(colours: string[]): string[] {
  const scores = new Map<string, number>();

  for (const hex of colours) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;
    const lum = luminance(rgb);
    const sat = saturation(rgb);

    // Skip near-white / near-black for brand ranking (still useful as bg/text later).
    let score = 1;
    if (lum > 0.92 || lum < 0.08) score = 0.15;
    else score += sat * 3 + (1 - Math.abs(lum - 0.45)) * 0.5;

    scores.set(hex, (scores.get(hex) ?? 0) + score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);
}

function mapFontFamily(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .split(",")[0]
    ?.replace(/["']/g, "")
    .trim()
    .toLowerCase();
  if (!cleaned) return null;

  for (const option of FONT_OPTIONS) {
    if (option.toLowerCase() === cleaned) return option;
    if (cleaned.includes(option.toLowerCase())) return option;
  }

  // Common web fonts → closest curated option
  if (cleaned.includes("inter") || cleaned.includes("helvetica") || cleaned.includes("arial")) {
    return "DM Sans";
  }
  if (cleaned.includes("roboto") || cleaned.includes("open sans") || cleaned.includes("lato")) {
    return "Source Sans 3";
  }
  if (cleaned.includes("poppins") || cleaned.includes("montserrat") || cleaned.includes("nunito")) {
    return "Manrope";
  }
  if (cleaned.includes("raleway") || cleaned.includes("avenir") || cleaned.includes("gilroy")) {
    return "Sora";
  }
  if (cleaned.includes("space") || cleaned.includes("jetbrains") || cleaned.includes("mono")) {
    return "Space Grotesk";
  }
  if (cleaned.includes("display") || cleaned.includes("serif") || cleaned.includes("playfair")) {
    return "Outfit";
  }

  return null;
}

function extractFonts(html: string): { heading?: string; body?: string } {
  const google = /fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/i.exec(html);
  if (google?.[1]) {
    const families = decodeURIComponent(google[1])
      .split("|")
      .map((part) => part.split(":")[0]?.replace(/\+/g, " ") ?? "")
      .filter(Boolean);
    const mapped = families.map(mapFontFamily).filter(Boolean) as string[];
    if (mapped.length >= 2) return { heading: mapped[0], body: mapped[1] };
    if (mapped.length === 1) return { heading: mapped[0], body: mapped[0] };
  }

  const fontFamilyRe = /font-family\s*:\s*([^;}{]+)/gi;
  const mapped: string[] = [];
  let match: RegExpExecArray | null;
  const css = extractStyleBlocks(html);
  while ((match = fontFamilyRe.exec(css))) {
    const font = mapFontFamily(match[1]);
    if (font && !mapped.includes(font)) mapped.push(font);
  }
  if (mapped.length >= 2) return { heading: mapped[0], body: mapped[1] };
  if (mapped.length === 1) return { heading: mapped[0], body: mapped[0] };
  return {};
}

function pickLogo(html: string, baseUrl: string): string | null {
  const apple = collectLinkHrefs(html, ["apple-touch-icon"]);
  const icons = collectLinkHrefs(html, ["icon"]);
  const og = collectMetaContent(html, ["og:image", "twitter:image"]);
  const candidates = [...apple, ...icons, ...og]
    .map((href) => absoluteUrl(baseUrl, href))
    .filter(Boolean) as string[];

  // Prefer SVG / PNG icons over huge OG photos when possible.
  const preferred =
    candidates.find((u) => /\.svg(\?|$)/i.test(u)) ||
    candidates.find((u) => /apple-touch|favicon|logo/i.test(u)) ||
    candidates.find((u) => /\.(png|webp|jpg|jpeg)(\?|$)/i.test(u)) ||
    candidates[0] ||
    null;

  return preferred;
}

/**
 * Pure HTML → brand token suggestion. Safe for unit tests (no network).
 */
export function extractBrandSuggestionFromHtml(
  html: string,
  sourceUrl: string,
): WebsiteBrandSuggestion {
  const notes: string[] = [];
  const colours = extractColourCandidates(html);
  const ranked = rankColours(colours);

  const brandish = ranked.filter((hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    const lum = luminance(rgb);
    return lum >= 0.08 && lum <= 0.92;
  });

  const lights = ranked.filter((hex) => {
    const rgb = hexToRgb(hex);
    return rgb ? luminance(rgb) > 0.85 : false;
  });
  const darks = ranked.filter((hex) => {
    const rgb = hexToRgb(hex);
    return rgb ? luminance(rgb) < 0.2 : false;
  });

  const primary = brandish[0] ?? "#0F766E";
  const accent = brandish[1] ?? brandish[0] ?? "#D97706";
  const secondary = brandish[2] ?? darken(primary, 0.25);

  let background = lights[0] ?? lighten(primary, 0.92);
  let surface = lights[1] ?? "#FFFFFF";
  if (background.toUpperCase() === surface.toUpperCase()) {
    surface = "#FFFFFF";
    if (background.toUpperCase() === "#FFFFFF") {
      background = lighten(primary, 0.94);
    }
  }

  let text = darks[0] ?? "#14201C";
  const textRgb = hexToRgb(text);
  if (textRgb && luminance(textRgb) > 0.35) {
    text = darken(primary, 0.7);
  }
  // Keep muted readable on light surfaces (~AA+), not washed-out.
  const mutedText = mix(text, background, 0.28);

  const fonts = extractFonts(html);
  const headingFont = fonts.heading ?? "Outfit";
  const bodyFont = fonts.body ?? "Source Sans 3";

  const logoUrl = pickLogo(html, sourceUrl);

  if (brandish.length === 0) {
    notes.push(
      "Few brand colours were detected — defaults were filled in. Adjust in the editor.",
    );
  } else {
    notes.push(`Detected ${brandish.length} usable brand colour(s) from the page.`);
  }
  if (logoUrl) notes.push("Found a logo / icon candidate from the page.");
  else notes.push("No clear logo found — upload one manually if needed.");
  if (fonts.heading || fonts.body) {
    notes.push("Mapped site fonts to the closest curated font options.");
  }

  // Slightly bolder sites → modern; quieter → corporate
  const layoutId: DesignTokens["layoutId"] =
    brandish.length >= 4 || (hexToRgb(primary) && saturation(hexToRgb(primary)!) > 0.55)
      ? "modern"
      : "corporate";

  return {
    sourceUrl,
    primary,
    secondary,
    accent: accent.toUpperCase() === primary.toUpperCase() ? lighten(primary, 0.2) : accent,
    background,
    surface,
    text,
    mutedText,
    headingFont,
    bodyFont,
    logoUrl,
    layoutId,
    notes,
    coloursFound: ranked.slice(0, 12),
  };
}
