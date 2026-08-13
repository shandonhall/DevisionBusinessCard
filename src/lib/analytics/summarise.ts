import {
  HIGH_INTENT_EVENT_TYPES,
  type AnalyticsEventType,
  type TrafficSource,
} from "@/lib/analytics/types";

export type AnalyticsOverview = {
  cardViews: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  averageEngagedTimeMs: number;
  highIntentActions: number;
  contactsSaved: number;
  vcardDownloads: number;
  qrAttributedOpens: number;
  flipSessions: number;
  flipRate: number;
};

type EventRow = {
  card_id: string;
  employee_id: string | null;
  brand_id: string | null;
  location_id: string | null;
  session_id: string;
  event_type: string;
  source: string;
  occurred_at: string;
  metadata: unknown;
};

function emptyOverview(): AnalyticsOverview {
  return {
    cardViews: 0,
    sessions: 0,
    engagedSessions: 0,
    engagementRate: 0,
    averageEngagedTimeMs: 0,
    highIntentActions: 0,
    contactsSaved: 0,
    vcardDownloads: 0,
    qrAttributedOpens: 0,
    flipSessions: 0,
    flipRate: 0,
  };
}

export function summariseEvents(events: EventRow[]): AnalyticsOverview {
  if (events.length === 0) return emptyOverview();
  const sessions = new Set(events.map((event) => event.session_id));
  const engaged = new Set(
    events
      .filter((event) => event.event_type === "card_engaged")
      .map((event) => event.session_id),
  );
  const flipped = new Set(
    events
      .filter((event) => event.event_type === "card_flip")
      .map((event) => event.session_id),
  );
  const highIntent = events.filter((event) =>
    (HIGH_INTENT_EVENT_TYPES as readonly string[]).includes(event.event_type),
  ).length;
  const timeMs = events
    .filter((event) => event.event_type === "engagement_time")
    .reduce((sum, event) => {
      const meta = event.metadata as { activeMilliseconds?: number } | null;
      return sum + (Number(meta?.activeMilliseconds) || 0);
    }, 0);
  const sessionCount = sessions.size;
  const engagedCount = engaged.size;
  return {
    cardViews: events.filter((event) => event.event_type === "card_view").length,
    sessions: sessionCount,
    engagedSessions: engagedCount,
    engagementRate: sessionCount ? engagedCount / sessionCount : 0,
    averageEngagedTimeMs: engagedCount ? timeMs / engagedCount : 0,
    highIntentActions: highIntent,
    contactsSaved: events.filter((event) => event.event_type === "save_contact")
      .length,
    vcardDownloads: events.filter((event) => event.event_type === "vcard_download")
      .length,
    qrAttributedOpens: new Set(
      events
        .filter(
          (event) =>
            event.source === "qr" &&
            (event.event_type === "card_view" ||
              event.event_type === "qr_source_open"),
        )
        .map((event) => event.session_id),
    ).size,
    flipSessions: flipped.size,
    flipRate: sessionCount ? flipped.size / sessionCount : 0,
  };
}

export function countBySource(
  events: Array<{ source: string; event_type: string; session_id: string }>,
): Record<TrafficSource, number> {
  const counts: Record<TrafficSource, number> = {
    qr: 0,
    direct: 0,
    shared: 0,
    campaign: 0,
    other: 0,
  };
  const seen = new Set<string>();
  for (const event of events) {
    if (event.event_type !== "card_view") continue;
    const key = `${event.session_id}:${event.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (event.source in counts) {
      counts[event.source as TrafficSource] += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}

export function countByEventType(
  events: Array<{ event_type: string }>,
): Partial<Record<AnalyticsEventType, number>> {
  const counts: Partial<Record<AnalyticsEventType, number>> = {};
  for (const event of events) {
    const type = event.event_type as AnalyticsEventType;
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

export function seriesByDay(
  events: Array<{ occurred_at: string; event_type: string; session_id: string }>,
) {
  const days = new Map<
    string,
    { views: number; engaged: number; highIntent: number }
  >();
  const engagedOnce = new Set<string>();
  for (const event of events) {
    const day = event.occurred_at.slice(0, 10);
    const current = days.get(day) ?? { views: 0, engaged: 0, highIntent: 0 };
    if (event.event_type === "card_view") current.views += 1;
    if (event.event_type === "card_engaged") {
      const key = `${day}:${event.session_id}`;
      if (!engagedOnce.has(key)) {
        engagedOnce.add(key);
        current.engaged += 1;
      }
    }
    if ((HIGH_INTENT_EVENT_TYPES as readonly string[]).includes(event.event_type)) {
      current.highIntent += 1;
    }
    days.set(day, current);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));
}
