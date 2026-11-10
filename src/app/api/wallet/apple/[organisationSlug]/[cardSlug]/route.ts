import { NextResponse } from "next/server";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { getAppleWalletConfig, getServerEnv } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";
import { recordDownloadEvent } from "@/lib/analytics/server";
import { createApplePass } from "@/lib/wallet/apple-pass";

type Params = {
  params: Promise<{ organisationSlug: string; cardSlug: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { organisationSlug, cardSlug } = await params;

  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = getAppleWalletConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Apple Wallet is not configured" },
      { status: 404 },
    );
  }

  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);

  if (resolved.type === "redirect") {
    const url = new URL(req.url);
    url.pathname = `/api/wallet/apple/${resolved.organisationSlug}/${resolved.toSlug}`;
    return NextResponse.redirect(url, 308);
  }

  if (resolved.type !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const model = resolved.view;
  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const requestUrl = new URL(req.url);

  let pass: Buffer;
  try {
    pass = await createApplePass(model, {
      config,
      absoluteCardUrl: `${appUrl}${model.card.publicPath}`,
      assetOrigin: requestUrl.origin,
      platformName: env.NEXT_PUBLIC_PLATFORM_NAME,
    });
  } catch (error) {
    console.error("Apple Wallet pass generation failed", error);
    return NextResponse.json(
      { error: "Could not create the Wallet pass" },
      { status: 500 },
    );
  }

  await recordDownloadEvent(requestUrl, model.card.id, "wallet_pass_download", {
    via: "apple_wallet_endpoint",
  });

  return new NextResponse(new Uint8Array(pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${model.card.slug}.pkpass"`,
      "Cache-Control": "private, no-store",
    },
  });
}
