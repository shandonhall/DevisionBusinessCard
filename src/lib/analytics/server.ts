import { createClient } from "@/lib/supabase/server";
import { parseTrafficSource } from "@/lib/analytics/source";
import type { AnalyticsEventType } from "@/lib/analytics/types";
import { hasSupabasePublicConfig } from "@/lib/validation/env";
import type { Json } from "@/types/database";

const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Records a public event from a file download route using the `sid` / `src`
 * the card page attached to the link. Requests without a session (admin
 * preview, pasted links) are not recorded. Never throws.
 */
export async function recordDownloadEvent(
  requestUrl: URL,
  cardId: string,
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown>,
) {
  const sessionId = requestUrl.searchParams.get("sid")?.trim() ?? "";
  if (!SESSION_ID.test(sessionId) || !hasSupabasePublicConfig()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("ingest_card_analytics_event", {
      p_card_id: cardId,
      p_session_id: sessionId,
      p_event_type: eventType,
      p_source: parseTrafficSource(requestUrl.searchParams.get("src")),
      p_metadata: metadata as Json,
    });
  } catch {
    /* never block the download */
  }
}
