import {
  ENGAGEMENT_FLUSH_MS,
  ENGAGEMENT_INACTIVITY_MS,
  type AnalyticsEventInput,
  type AnalyticsEventType,
  type PublicAnalyticsContext,
} from "@/lib/analytics/types";
import { presentationModeFromWidth } from "@/lib/experience/presentation";
import { clampMetadata, shouldMarkEngaged } from "@/lib/analytics/engagement";
import {
  getOrCreateAnalyticsSessionId,
  markSessionEventOnce,
} from "@/lib/analytics/session";

const INGEST_PATH = "/api/analytics/events";

type PendingEngagement = {
  activeMs: number;
  lastVisibleAt: number | null;
  lastActivityAt: number;
  engaged: boolean;
};

function currentPresentation() {
  if (typeof window === "undefined") return "mobile";
  return presentationModeFromWidth(window.innerWidth);
}

function postEvent(body: unknown, keepalive = false) {
  const payload = JSON.stringify(body);
  if (keepalive && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(INGEST_PATH, blob);
    return;
  }
  void fetch(INGEST_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive,
  }).catch(() => {
    /* never block the card */
  });
}

export function createPublicAnalyticsTracker(context: PublicAnalyticsContext) {
  const sessionId = getOrCreateAnalyticsSessionId();
  const onceKey = `${context.cardId}:${sessionId}`;
  const state: PendingEngagement = {
    activeMs: 0,
    lastVisibleAt: null,
    lastActivityAt: Date.now(),
    engaged: false,
  };

  function isVisible() {
    return (
      typeof document === "undefined" ||
      document.visibilityState === "visible"
    );
  }

  function accumulate() {
    if (state.lastVisibleAt == null) return;
    const now = Date.now();
    const inactive = now - state.lastActivityAt > ENGAGEMENT_INACTIVITY_MS;
    if (!isVisible() || inactive) {
      state.activeMs += Math.max(0, now - state.lastVisibleAt);
      state.lastVisibleAt = null;
      return;
    }
    state.activeMs += Math.max(0, now - state.lastVisibleAt);
    state.lastVisibleAt = now;
  }

  function maybeEngage(eventType?: AnalyticsEventType) {
    accumulate();
    if (
      !shouldMarkEngaged({
        alreadyEngaged: state.engaged,
        activeVisibleMs: state.activeMs,
        eventType,
      })
    ) {
      return;
    }
    state.engaged = true;
    send("card_engaged", { reason: eventType ?? "visible_threshold" }, true);
  }

  function send(
    eventType: AnalyticsEventType,
    metadata?: Record<string, unknown>,
    once = false,
  ) {
    if (once && !markSessionEventOnce(`${onceKey}:${eventType}`)) return;
    postEvent({
      cardId: context.cardId,
      sessionId,
      eventType,
      source: context.source,
      metadata: clampMetadata({
        ...metadata,
        presentation: currentPresentation(),
      }),
    });
  }

  function track(input: AnalyticsEventInput) {
    state.lastActivityAt = Date.now();
    if (isVisible() && state.lastVisibleAt == null) {
      state.lastVisibleAt = Date.now();
    }
    send(input.eventType, input.metadata);
    maybeEngage(input.eventType);
  }

  function flushEngagement(reason: string, keepalive = false) {
    accumulate();
    const ms = Math.round(state.activeMs);
    if (ms < 250) return;
    state.activeMs = 0;
    postEvent(
      {
        cardId: context.cardId,
        sessionId,
        eventType: "engagement_time",
        source: context.source,
        metadata: clampMetadata({
          activeMilliseconds: ms,
          flushReason: reason,
          presentation: currentPresentation(),
        }),
      },
      keepalive,
    );
  }

  function start() {
    if (markSessionEventOnce(`${onceKey}:card_view`)) {
      send("card_view", { source: context.source }, false);
      if (context.source === "qr") {
        send("qr_source_open", { attributed: true }, true);
      }
    }

    if (isVisible()) state.lastVisibleAt = Date.now();

    const onVisibility = () => {
      if (isVisible()) {
        state.lastVisibleAt = Date.now();
        state.lastActivityAt = Date.now();
      } else {
        flushEngagement("hidden", true);
      }
    };
    const onActivity = () => {
      state.lastActivityAt = Date.now();
      if (isVisible() && state.lastVisibleAt == null) {
        state.lastVisibleAt = Date.now();
      }
      maybeEngage();
    };
    const onHide = () => flushEngagement("pagehide", true);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("pagehide", onHide);

    const tick = window.setInterval(() => {
      maybeEngage();
      flushEngagement("interval");
    }, ENGAGEMENT_FLUSH_MS);

    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("pagehide", onHide);
      flushEngagement("unmount", true);
    };
  }

  return { track, start, sessionId, source: context.source };
}
