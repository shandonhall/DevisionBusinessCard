import { NextResponse } from "next/server";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { buildVCard } from "@/lib/vcard/build";
import { getServerEnv, hasSupabasePublicConfig } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/server";
import { parseTrafficSource } from "@/lib/analytics/source";
import type { Json } from "@/types/database";

const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = {
  params: Promise<{ organisationSlug: string; cardSlug: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { organisationSlug, cardSlug } = await params;

  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);

  if (resolved.type === "redirect") {
    const url = new URL(req.url);
    url.pathname = `/api/vcard/${resolved.organisationSlug}/${resolved.toSlug}`;
    return NextResponse.redirect(url, 308);
  }

  if (resolved.type !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const model = resolved.view;
  const env = getServerEnv();
  const cardUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${model.card.publicPath}`;

  const vcard = buildVCard({
    firstName: model.employee.firstName,
    lastName: model.employee.lastName,
    displayName: model.employee.displayName,
    organisation: model.brand?.name || model.organisation.name,
    title: model.employee.jobTitle,
    email: model.employee.email,
    mobile: model.employee.mobile,
    website: model.brand?.website || model.organisation.website,
    linkedinUrl: model.employee.linkedinUrl,
    cardUrl,
    note: model.employee.bio,
  });

  const filename = `${model.card.slug}.vcf`;

  const requestUrl = new URL(req.url);
  const sessionId = requestUrl.searchParams.get("sid")?.trim() ?? "";
  if (SESSION_ID.test(sessionId) && hasSupabasePublicConfig()) {
    try {
      const supabase = await createClient();
      await supabase.rpc("ingest_card_analytics_event", {
        p_card_id: model.card.id,
        p_session_id: sessionId,
        p_event_type: "vcard_download",
        p_source: parseTrafficSource(requestUrl.searchParams.get("src")),
        p_metadata: { via: "vcard_endpoint" } as Json,
      });
    } catch {
      /* never block the vCard file */
    }
  }

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
