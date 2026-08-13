import {
  ENGAGED_VISIBLE_MS,
  ENGAGING_EVENT_TYPES,
  type AnalyticsEventType,
} from "@/lib/analytics/types";

/**
 * A session becomes engaged when either:
 * A) visible/active for ENGAGED_VISIBLE_MS, or
 * B) a meaningful interaction occurs first.
 * Fire `card_engaged` once per session.
 */
export function shouldMarkEngaged(params: {
  alreadyEngaged: boolean;
  activeVisibleMs: number;
  eventType?: AnalyticsEventType;
}): boolean {
  if (params.alreadyEngaged) return false;
  if (params.activeVisibleMs >= ENGAGED_VISIBLE_MS) return true;
  if (
    params.eventType &&
    (ENGAGING_EVENT_TYPES as readonly string[]).includes(params.eventType)
  ) {
    return true;
  }
  return false;
}

export function clampMetadata(
  metadata: Record<string, unknown> | undefined,
  maxBytes = 2048,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try {
    const json = JSON.stringify(metadata);
    if (json.length <= maxBytes) return metadata;
    return { truncated: true };
  } catch {
    return undefined;
  }
}
