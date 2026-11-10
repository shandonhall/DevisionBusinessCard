import { NextResponse } from "next/server";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { getAppleWalletConfig, getServerEnv } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";
import { recordDownloadEvent } from "@/lib/analytics/server";
import { withAttribution } from "@/lib/analytics/source";
import { createApplePass } from "@/lib/wallet/apple-pass";
import { buildApplePassContent } from "@/lib/wallet/apple-pass-content";
import {
  buildWalletWalletBody,
  createWalletWalletPass,
  WalletWalletError,
} from "@/lib/wallet/walletwallet";

type Params = {
  params: Promise<{ organisationSlug: string; cardSlug: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { organisationSlug, cardSlug } = await params;

  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const env = getServerEnv();
  const config = getAppleWalletConfig(env);
  const walletWalletKey = env.WALLETWALLET_API_KEY;
  if (!config && !walletWalletKey) {
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
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const absoluteCardUrl = `${appUrl}${model.card.publicPath}`;
  const requestUrl = new URL(req.url);

  let pass: Buffer;
  let via: string;
  try {
    if (config) {
      via = "apple_wallet_endpoint";
      pass = await createApplePass(model, {
        config,
        absoluteCardUrl,
        assetOrigin: requestUrl.origin,
        platformName: env.NEXT_PUBLIC_PLATFORM_NAME,
      });
    } else {
      via = "walletwallet";
      const content = buildApplePassContent(model, {
        cardUrl: withAttribution(absoluteCardUrl, "wallet"),
        hasLogoImage: false,
        platformName: env.NEXT_PUBLIC_PLATFORM_NAME,
      });
      pass = await createWalletWalletPass(
        buildWalletWalletBody(content, model.tokens),
        walletWalletKey!,
      );
    }
  } catch (error) {
    console.error("Apple Wallet pass generation failed", error);
    const quotaHit = error instanceof WalletWalletError && error.status === 429;
    return NextResponse.json(
      {
        error: quotaHit
          ? "Wallet passes are temporarily unavailable. Please try again later."
          : "Could not create the Wallet pass",
      },
      { status: quotaHit ? 503 : 500 },
    );
  }

  await recordDownloadEvent(requestUrl, model.card.id, "wallet_pass_download", {
    via,
  });

  return new NextResponse(new Uint8Array(pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${model.card.slug}.pkpass"`,
      "Cache-Control": "private, no-store",
    },
  });
}
