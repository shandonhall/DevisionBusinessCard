import { OrganisationSwitcher } from "@/components/admin/organisation-switcher";
import {
  getAuthContext,
  getPrimaryOrganisation,
} from "@/lib/auth/session";
import { listAccessibleOrganisations } from "@/lib/db/organisations";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

/** Platform admins only — loads tenant list for the dashboard switcher. */
export async function PlatformOrgSwitcher() {
  const context = await getAuthContext();
  if (!context || !canAccessPlatformAdmin(context.profile)) {
    return null;
  }

  const [organisations, current] = await Promise.all([
    listAccessibleOrganisations(),
    getPrimaryOrganisation(context),
  ]);

  return (
    <OrganisationSwitcher
      organisations={organisations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
      }))}
      currentOrganisationId={current?.id ?? null}
    />
  );
}
