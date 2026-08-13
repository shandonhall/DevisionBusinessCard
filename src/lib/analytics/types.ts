/**
 * First-party card analytics — semantics from ANALYTICS_EVENT_SPEC.md.
 * Do not label these events as revenue, sales, or ROI.
 */

export const ANALYTICS_EVENT_TYPES = [
  "card_view",
  "qr_source_open",
  "card_engaged",
  "engagement_time",
  "card_flip",
  "save_contact",
  "call_click",
  "whatsapp_click",
  "email_click",
  "website_click",
  "share_click",
  "copy_link",
  "campaign_impression",
  "campaign_click",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const TRAFFIC_SOURCES = [
  "qr",
  "direct",
  "shared",
  "campaign",
  "other",
] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

export const HIGH_INTENT_EVENT_TYPES = [
  "save_contact",
  "call_click",
  "whatsapp_click",
  "email_click",
  "website_click",
] as const;

export type HighIntentEventType = (typeof HIGH_INTENT_EVENT_TYPES)[number];

export const ENGAGING_EVENT_TYPES = [
  ...HIGH_INTENT_EVENT_TYPES,
  "card_flip",
  "share_click",
  "campaign_click",
] as const;

/** Visible/active milliseconds before a session is engaged without interaction. */
export const ENGAGED_VISIBLE_MS = 8_000;

/** Pause active-time counting after this much inactivity. */
export const ENGAGEMENT_INACTIVITY_MS = 30_000;

/** How often to flush engagement_time while the tab stays open. */
export const ENGAGEMENT_FLUSH_MS = 15_000;

export type AnalyticsEventInput = {
  eventType: AnalyticsEventType;
  metadata?: Record<string, unknown>;
};

export type AnalyticsTracker = {
  track: (input: AnalyticsEventInput) => void;
};

export type PublicAnalyticsContext = {
  cardId: string;
  organisationId: string;
  employeeId: string | null;
  brandId: string | null;
  locationId: string | null;
  source: TrafficSource;
  presentation?: string;
};
