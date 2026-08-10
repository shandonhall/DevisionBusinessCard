import "server-only";

import {
  extractBrandSuggestionFromHtml,
  type WebsiteBrandSuggestion,
} from "@/lib/branding/extract-from-website";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 4;

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }

  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip);
  if (!v4) return false;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid website URL (https://…)");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("That host is not allowed");
  }

  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("Private network addresses are not allowed");
  }

  return url;
}

async function assertPublicHostname(hostname: string) {
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Private network addresses are not allowed");
    }
    return;
  }

  const results = await lookup(hostname, { all: true });
  if (!results.length) {
    throw new Error("Could not resolve that website");
  }
  for (const result of results) {
    if (isPrivateIp(result.address)) {
      throw new Error("That website resolves to a private address");
    }
  }
}

async function fetchHtmlFollowingRedirects(start: URL): Promise<{
  finalUrl: string;
  html: string;
}> {
  let current = start;

  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    await assertPublicHostname(current.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "DeVisionBrandImporter/1.0 (+https://localhost; brand kit assist)",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Website redirect was missing a location");
        }
        current = assertSafeUrl(new URL(location, current).toString());
        continue;
      }

      if (!response.ok) {
        throw new Error(`Website returned HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (
        contentType &&
        !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)
      ) {
        throw new Error("URL did not return an HTML page");
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) {
        throw new Error("Website HTML is too large to analyse");
      }

      return {
        finalUrl: current.toString(),
        html: buffer.toString("utf8"),
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timed out fetching the website");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Too many redirects");
}

export async function importBrandFromWebsiteUrl(
  websiteUrl: string,
): Promise<WebsiteBrandSuggestion> {
  const start = assertSafeUrl(websiteUrl);
  const { finalUrl, html } = await fetchHtmlFollowingRedirects(start);
  if (!html.trim()) {
    throw new Error("Website returned an empty page");
  }
  return extractBrandSuggestionFromHtml(html, finalUrl);
}
