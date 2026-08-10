import { AppHeader } from "@/components/admin/app-header";
import { MyCardEditor } from "@/components/employee/my-card-editor";
import {
  getPrimaryOrganisation,
  requireAuthContext,
} from "@/lib/auth/session";
import { getCardByEmployee } from "@/lib/db/cards";
import {
  claimEmployeeProfileForCurrentUser,
  getEmployeeForUser,
} from "@/lib/db/employee-self";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function MyCardPage() {
  const context = await requireAuthContext();
  let employee = await getEmployeeForUser(context.userId);

  // Soft auto-claim when email matches an unlinked employee.
  if (!employee) {
    try {
      employee = await claimEmployeeProfileForCurrentUser();
    } catch {
      employee = null;
    }
  }

  const organisation = await getPrimaryOrganisation(context);
  let publicPath: string | null = null;
  if (employee && organisation) {
    const card = await getCardByEmployee(employee.organisation_id, employee.id);
    if (card && card.public_status === "active") {
      publicPath = `/${organisation.slug}/${card.slug}`;
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        title="My card"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My card</h1>
          <p className="text-[var(--brand-muted-text)]">
            Keep your contact details and photo up to date for your digital
            business card.
          </p>
        </div>
        <MyCardEditor employee={employee} publicPath={publicPath} />
      </main>
    </div>
  );
}
