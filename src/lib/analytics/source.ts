import { TRAFFIC_SOURCES, type TrafficSource } from "@/lib/analytics/types";

const SOURCE_SET = new Set<string>(TRAFFIC_SOURCES);

/**
 * Allow-listed traffic source from a public card URL.
 * Unknown or missing values become `direct` for a first-party open
 * (typed `src` that is not allow-listed becomes `other`).
 */
export function parseTrafficSource(
  raw: string | null | undefined,
): TrafficSource {
  if (raw == null || raw.trim() === "") return "direct";
  const value = raw.trim().toLowerCase();
  if (value === "nfc") return "other";
  if (SOURCE_SET.has(value)) return value as TrafficSource;
  return "other";
}

export function withAttribution(
  absoluteUrl: string,
  source: Exclude<TrafficSource, "direct" | "other">,
  extra?: Record<string, string>,
): string {
  const url = new URL(absoluteUrl);
  url.searchParams.set("src", source);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function isValidEventType(value: string): boolean {
  return (
    value === "card_view" ||
    value === "qr_source_open" ||
    value === "card_engaged" ||
    value === "engagement_time" ||
    value === "card_flip" ||
    value === "save_contact" ||
    value === "call_click" ||
    value === "whatsapp_click" ||
    value === "email_click" ||
    value === "website_click" ||
    value === "share_click" ||
    value === "copy_link" ||
    value === "campaign_impression" ||
    value === "campaign_click"
  );
}
