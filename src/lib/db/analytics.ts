import "server-only";

import { createClient } from "@/lib/supabase/server";
import { summariseEvents } from "@/lib/analytics/summarise";

export type { AnalyticsOverview } from "@/lib/analytics/summarise";
export {
  summariseEvents,
  countBySource,
  countByEventType,
  seriesByDay,
} from "@/lib/analytics/summarise";

export type AnalyticsRange = {
  from: string;
  to: string;
};

async function loadEvents(params: {
  organisationId: string;
  from: string;
  to: string;
  cardId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("card_analytics_events")
    .select(
      "id, card_id, employee_id, brand_id, location_id, session_id, event_type, source, occurred_at, metadata",
    )
    .eq("organisation_id", params.organisationId)
    .gte("occurred_at", params.from)
    .lt("occurred_at", params.to);
  if (params.cardId) query = query.eq("card_id", params.cardId);
  const { data, error } = await query.limit(20000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrganisationAnalytics(
  organisationId: string,
  range: AnalyticsRange,
) {
  const events = await loadEvents({ organisationId, ...range });
  return { overview: summariseEvents(events), events };
}

export async function getCardAnalytics(
  organisationId: string,
  cardId: string,
  range: AnalyticsRange,
) {
  const events = await loadEvents({ organisationId, cardId, ...range });
  return { overview: summariseEvents(events), events };
}
