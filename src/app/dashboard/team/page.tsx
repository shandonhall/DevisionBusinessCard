import { redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { TeamManager } from "@/components/admin/team-manager";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listBrands, listEmployees, listLocations } from "@/lib/db/structure";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);
  const [brands, locations, employees] = await Promise.all([
    listBrands(organisation.id),
    listLocations(organisation.id),
    listEmployees(organisation.id),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Team"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
          <p className="text-[var(--brand-muted-text)]">
            Employees are scoped to your organisation and optionally assigned to
            a brand and location.
          </p>
        </div>
        <TeamManager
          organisationId={organisation.id}
          brands={brands}
          locations={locations}
          employees={employees}
        />
      </main>
    </div>
  );
}
