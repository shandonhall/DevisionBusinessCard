import { redirect } from "next/navigation";
import { CampaignManager } from "@/components/admin/campaign-manager";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listCampaigns } from "@/lib/db/campaigns";
import { listBrands, listLocations } from "@/lib/db/structure";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");
  await requireOrganisationAdmin(organisation.id);

  const [campaigns, brands, locations] = await Promise.all([
    listCampaigns(organisation.id),
    listBrands(organisation.id),
    listLocations(organisation.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
        <p className="text-[var(--brand-muted-text)]">
          Optional first-party desktop side content for {organisation.name}.
          These are dealership or brand promotions, not third-party ads. Mobile
          hides them automatically.
        </p>
      </div>
      <CampaignManager
        organisationId={organisation.id}
        campaigns={campaigns}
        brands={brands}
        locations={locations}
      />
    </main>
  );
}
