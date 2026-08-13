import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ANALYTICS_EVENT_TYPES, TRAFFIC_SOURCES } from "@/lib/analytics/types";
import { parseTrafficSource } from "@/lib/analytics/source";
import type { Json } from "@/types/database";

const ingestSchema = z.object({
  cardId: z.string().uuid(),
  sessionId: z.string().uuid(),
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  source: z.enum(TRAFFIC_SOURCES).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public ingest only. Never returns analytics rows.
 * Organisation is resolved from the card inside the RPC.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source = parseTrafficSource(parsed.data.source);
  const supabase = await createClient();
  const { error } = await supabase.rpc("ingest_card_analytics_event", {
    p_card_id: parsed.data.cardId,
    p_session_id: parsed.data.sessionId,
    p_event_type: parsed.data.eventType,
    p_source: source,
    p_metadata: (parsed.data.metadata ?? {}) as Json,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
