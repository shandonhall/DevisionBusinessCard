import { redirect } from "next/navigation";
import { BrandsManager } from "@/components/admin/brands-manager";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listBrands } from "@/lib/db/structure";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);
  const brands = await listBrands(organisation.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Brands</h1>
        <p className="text-[var(--brand-muted-text)]">
          Vehicle marques under {organisation.name} (AGG Motors, Geely,
          Jetour, MG, JAC). Drive visual DNA for each marque is applied
          automatically from employee marque assignments - edit name,
          website, and logo path here; advanced material/lighting stays in
          the Drive marque presets.
        </p>
      </div>
      <BrandsManager organisationId={organisation.id} brands={brands} />
    </main>
  );
}
