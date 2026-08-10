import { NextResponse } from "next/server";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { buildVCard } from "@/lib/vcard/build";
import { getServerEnv } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";

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

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
