import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganisationSettingsForm } from "@/components/branding/organisation-settings-form";
import { Button } from "@/components/ui/button";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);

  if (!organisation) {
    redirect("/dashboard");
  }

  await requireOrganisationAdmin(organisation.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Organisation settings
          </h1>
          <p className="text-[var(--brand-muted-text)]">
            Edit organisation profile details. Brand colours live under Brand.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/account">Change password</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/brand">Edit brand kit</Link>
          </Button>
        </div>
      </div>

      <OrganisationSettingsForm organisation={organisation} />
    </main>
  );
}
