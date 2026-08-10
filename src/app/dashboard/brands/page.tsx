import { redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { BrandsManager } from "@/components/admin/brands-manager";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listBrands } from "@/lib/db/structure";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);
  const brands = await listBrands(organisation.id);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Brands"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Brands</h1>
          <p className="text-[var(--brand-muted-text)]">
            Manage brands under {organisation.name}. Each brand can have its
            own locations and employees.
          </p>
        </div>
        <BrandsManager organisationId={organisation.id} brands={brands} />
      </main>
    </div>
  );
}
