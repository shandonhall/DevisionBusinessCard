"use client";

import { useEffect, useMemo } from "react";
import { createPublicAnalyticsTracker } from "@/lib/analytics/client";
import type {
  AnalyticsTracker,
  PublicAnalyticsContext,
} from "@/lib/analytics/types";

/**
 * Starts first-party analytics for a public card. Pass null on admin preview.
 */
export function usePublicAnalytics(
  context: PublicAnalyticsContext | null,
): AnalyticsTracker | undefined {
  const enabled = context != null;
  const cardId = context?.cardId ?? null;
  const organisationId = context?.organisationId ?? null;
  const employeeId = context?.employeeId ?? null;
  const brandId = context?.brandId ?? null;
  const locationId = context?.locationId ?? null;
  const source = context?.source ?? null;

  const tracker = useMemo(() => {
    if (!enabled || !cardId || !organisationId || !source) return undefined;
    return createPublicAnalyticsTracker({
      cardId,
      organisationId,
      employeeId,
      brandId,
      locationId,
      source,
    });
  }, [enabled, cardId, organisationId, employeeId, brandId, locationId, source]);

  useEffect(() => {
    if (!tracker) return;
    return tracker.start();
  }, [tracker]);

  return tracker;
}
