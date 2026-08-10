import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { LocationsManager } from "@/components/admin/locations-manager";
import { Button } from "@/components/ui/button";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listBrands, listLocations } from "@/lib/db/structure";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);
  const [brands, locations] = await Promise.all([
    listBrands(organisation.id),
    listLocations(organisation.id),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Locations"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Locations</h1>
            <p className="text-[var(--brand-muted-text)]">
              Branches, dealerships, offices and teams under each brand.
            </p>
          </div>
          {brands.length === 0 ? (
            <Button asChild>
              <Link href="/dashboard/brands">Create a brand first</Link>
            </Button>
          ) : null}
        </div>
        <LocationsManager
          organisationId={organisation.id}
          brands={brands}
          locations={locations}
        />
      </main>
    </div>
  );
}
