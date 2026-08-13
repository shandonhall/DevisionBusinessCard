import { describe, expect, it } from "vitest";
import { parseTrafficSource, withAttribution } from "@/lib/analytics/source";
import { shouldMarkEngaged } from "@/lib/analytics/engagement";
import { ENGAGED_VISIBLE_MS } from "@/lib/analytics/types";
import { summariseEvents } from "@/lib/analytics/summarise";

describe("traffic source allow-list", () => {
  it("treats missing src as direct", () => {
    expect(parseTrafficSource(null)).toBe("direct");
    expect(parseTrafficSource("")).toBe("direct");
  });

  it("accepts known sources", () => {
    expect(parseTrafficSource("qr")).toBe("qr");
    expect(parseTrafficSource("shared")).toBe("shared");
    expect(parseTrafficSource("campaign")).toBe("campaign");
  });

  it("maps unknown and reserved nfc to other", () => {
    expect(parseTrafficSource("utm_hack")).toBe("other");
    expect(parseTrafficSource("nfc")).toBe("other");
  });

  it("stamps attribution without spoiling the path", () => {
    expect(withAttribution("https://example.com/agg/jane", "qr")).toBe(
      "https://example.com/agg/jane?src=qr",
    );
  });
});

describe("engagement rule", () => {
  it("does not re-fire once engaged", () => {
    expect(
      shouldMarkEngaged({
        alreadyEngaged: true,
        activeVisibleMs: 20_000,
        eventType: "whatsapp_click",
      }),
    ).toBe(false);
  });

  it("engages after visible threshold", () => {
    expect(
      shouldMarkEngaged({
        alreadyEngaged: false,
        activeVisibleMs: ENGAGED_VISIBLE_MS,
      }),
    ).toBe(true);
  });

  it("engages on first high-intent or flip", () => {
    expect(
      shouldMarkEngaged({
        alreadyEngaged: false,
        activeVisibleMs: 100,
        eventType: "card_flip",
      }),
    ).toBe(true);
    expect(
      shouldMarkEngaged({
        alreadyEngaged: false,
        activeVisibleMs: 100,
        eventType: "copy_link",
      }),
    ).toBe(false);
  });
});

describe("dashboard summary language", () => {
  it("counts views and sessions without calling them unique people", () => {
    const overview = summariseEvents([
      {
        card_id: "c1",
        employee_id: "e1",
        brand_id: null,
        location_id: null,
        session_id: "s1",
        event_type: "card_view",
        source: "qr",
        occurred_at: "2026-08-13T10:00:00Z",
        metadata: {},
      },
      {
        card_id: "c1",
        employee_id: "e1",
        brand_id: null,
        location_id: null,
        session_id: "s1",
        event_type: "qr_source_open",
        source: "qr",
        occurred_at: "2026-08-13T10:00:01Z",
        metadata: {},
      },
      {
        card_id: "c1",
        employee_id: "e1",
        brand_id: null,
        location_id: null,
        session_id: "s1",
        event_type: "save_contact",
        source: "qr",
        occurred_at: "2026-08-13T10:00:05Z",
        metadata: {},
      },
    ]);
    expect(overview.cardViews).toBe(1);
    expect(overview.sessions).toBe(1);
    expect(overview.contactsSaved).toBe(1);
    expect(overview.highIntentActions).toBe(1);
    expect(overview.qrAttributedOpens).toBe(1);
  });
});
