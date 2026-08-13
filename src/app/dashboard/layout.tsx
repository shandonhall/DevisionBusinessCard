import { AppHeader } from "@/components/admin/app-header";
import {
  getPrimaryOrganisation,
  requireAuthContext,
} from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

/**
 * Shared dashboard chrome: org-aware brand mark in the header
 * (e.g. AGG logo + Powered by DeVision Media).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--brand-background)]">
      <AppHeader
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
        organisation={
          organisation
            ? { name: organisation.name, slug: organisation.slug }
            : null
        }
      />
      {/* Key forces dashboard pages to remount when the active tenant changes */}
      <div key={organisation?.id ?? "no-org"}>{children}</div>
    </div>
  );
}
