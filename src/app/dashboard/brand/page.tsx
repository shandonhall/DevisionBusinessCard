import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandKitEditor } from "@/components/branding/brand-kit-editor";
import { Button } from "@/components/ui/button";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { ensureDefaultBrandKit } from "@/lib/db/branding";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);

  if (!organisation) {
    redirect("/dashboard");
  }

  await requireOrganisationAdmin(organisation.id);
  const brandKit = await ensureDefaultBrandKit(organisation.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Brand kit</h1>
          <p className="max-w-2xl text-[var(--brand-muted-text)]">
            Configure organisation-level colours, typography and logo — or
            import them from your website. Cards inherit these tokens unless a
            later brand/location override is set.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard/settings">Organisation settings</Link>
        </Button>
      </div>

      <BrandKitEditor
        organisationId={organisation.id}
        organisationName={organisation.name}
        organisationWebsite={organisation.website}
        brandKit={brandKit}
      />
    </main>
  );
}
