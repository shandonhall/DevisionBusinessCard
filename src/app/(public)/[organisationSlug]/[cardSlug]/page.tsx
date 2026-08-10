import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicCardRenderer } from "@/components/cards/public-card-renderer";
import { CardUnavailablePage } from "@/components/cards/card-unavailable";
import { resolvePublicCardRequest } from "@/lib/db/cards";
import { getServerEnv } from "@/lib/validation/env";
import { RESERVED_ORG_SLUGS } from "@/lib/validation/auth";

type Props = {
  params: Promise<{ organisationSlug: string; cardSlug: string }>;
};

function absoluteUrl(path: string) {
  const env = getServerEnv();
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { organisationSlug, cardSlug } = await params;
  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    return { title: "Not found" };
  }

  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);
  if (resolved.type === "active") {
    return {
      title: resolved.view.card.pageTitle || resolved.view.employee.displayName,
      description:
        resolved.view.card.metaDescription ||
        resolved.view.employee.jobTitle ||
        `${resolved.view.employee.displayName} · ${resolved.view.organisation.name}`,
      robots: { index: false, follow: false },
    };
  }
  if (resolved.type === "paused") {
    return {
      title: "Card unavailable",
      robots: { index: false, follow: false },
    };
  }
  return { title: "Card not found" };
}

export default async function PublicCardPage({ params }: Props) {
  const { organisationSlug, cardSlug } = await params;

  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(organisationSlug)) {
    notFound();
  }

  const resolved = await resolvePublicCardRequest(organisationSlug, cardSlug);

  if (resolved.type === "redirect") {
    permanentRedirect(`/${resolved.organisationSlug}/${resolved.toSlug}`);
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

  return (
    <>
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(model.tokens.headingFont)}:wght@400;500;600;700&family=${encodeURIComponent(model.tokens.bodyFont)}:wght@400;500;600&display=swap`}
      />
      <PublicCardRenderer
        model={model}
        absoluteCardUrl={absoluteUrl(model.card.publicPath)}
      />
    </>
  );
}
