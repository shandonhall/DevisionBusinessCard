import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { PublicCardRenderer } from "@/components/cards/public-card-renderer";
import { Button } from "@/components/ui/button";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { getCardPreviewForAdmin } from "@/lib/db/cards";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";
import { getServerEnv } from "@/lib/validation/env";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardPreviewPage({ params }: Props) {
  const { cardId } = await params;
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);

  const model = await getCardPreviewForAdmin({
    organisationId: organisation.id,
    cardId,
  });

  if (!model) notFound();

  const env = getServerEnv();
  const absoluteCardUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${model.card.publicPath}`;

  return (
    <div className="min-h-screen bg-[var(--brand-background)]">
      <AppHeader
        title="Preview"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--brand-card-radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Admin preview — this card status may be draft/paused and is not
            necessarily public.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/cards">Back to cards</Link>
            </Button>
            {model.card.publicStatus === "active" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={model.card.publicPath} target="_blank">
                  Open public URL
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <PublicCardRenderer model={model} absoluteCardUrl={absoluteCardUrl} />
    </div>
  );
}
