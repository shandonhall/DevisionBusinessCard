import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { OrganisationSettingsForm } from "@/components/branding/organisation-settings-form";
import { Button } from "@/components/ui/button";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);

  if (!organisation) {
    redirect("/dashboard");
  }

  await requireOrganisationAdmin(organisation.id);
  const isPlatformAdmin = canAccessPlatformAdmin(context.profile);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Settings"
        email={context.email}
        showAdminLink={isPlatformAdmin}
      />
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
          <Button asChild variant="secondary">
            <Link href="/dashboard/brand">Edit brand kit</Link>
          </Button>
        </div>

        <OrganisationSettingsForm organisation={organisation} />
      </main>
    </div>
  );
}
