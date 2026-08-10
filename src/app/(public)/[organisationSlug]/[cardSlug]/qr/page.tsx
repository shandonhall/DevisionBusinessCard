import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { QrShareView } from "@/components/cards/qr-share-view";
import { CardUnavailablePage } from "@/components/cards/card-unavailable";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { getServerEnv } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";

type Props = {
  params: Promise<{ organisationSlug: string; cardSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { organisationSlug, cardSlug } = await params;
  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    return { title: "Not found" };
  }
  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);
  if (resolved.type === "active") {
    return {
      title: `QR · ${resolved.view.employee.displayName}`,
      robots: { index: false, follow: false },
    };
  }
  return { title: "QR", robots: { index: false, follow: false } };
}

export default async function PublicCardQrPage({ params }: Props) {
  const { organisationSlug, cardSlug } = await params;
  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    notFound();
  }

  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);

  if (resolved.type === "redirect") {
    permanentRedirect(`/${resolved.organisationSlug}/${resolved.toSlug}/qr`);
  }

  if (resolved.type === "paused") {
    return (
      <CardUnavailablePage
        organisationName={resolved.organisation.name}
        message={resolved.message}
        whiteLabelEnabled={resolved.organisation.whiteLabelEnabled}
      />
    );
  }

  if (resolved.type !== "active") {
    notFound();
  }

  const model = resolved.view;
  const env = getServerEnv();
  const absoluteCardUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${model.card.publicPath}`;

  return (
    <>
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(model.tokens.headingFont)}:wght@400;500;600;700&family=${encodeURIComponent(model.tokens.bodyFont)}:wght@400;500;600&display=swap`}
      />
      <QrShareView model={model} absoluteCardUrl={absoluteCardUrl} />
    </>
  );
}
