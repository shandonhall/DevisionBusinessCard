import { redirect } from "next/navigation";
import { AppHeader } from "@/components/admin/app-header";
import { CardsManager } from "@/components/admin/cards-manager";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import { listCards } from "@/lib/db/cards";
import { listEmployees } from "@/lib/db/structure";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");

  await requireOrganisationAdmin(organisation.id);
  const [cards, employees] = await Promise.all([
    listCards(organisation.id),
    listEmployees(organisation.id),
  ]);

  const cardByEmployee = new Map(cards.map((card) => [card.employee_id, card]));
  const employeesWithoutCards = employees
    .filter((employee) => employee.status === "active")
    .filter((employee) => {
      const card = cardByEmployee.get(employee.id);
      return !card || card.public_status !== "active";
    })
    .map((employee) => ({
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      display_name: employee.display_name,
      job_title: employee.job_title,
    }));

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Cards"
        email={context.email}
        showAdminLink={canAccessPlatformAdmin(context.profile)}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cards</h1>
          <p className="text-[var(--brand-muted-text)]">
            Publish employee cards to public URLs. Branding is inherited from
            organisation and brand kits — never hard-coded per client.
          </p>
        </div>
        <CardsManager
          organisationId={organisation.id}
          organisationSlug={organisation.slug}
          cards={cards}
          employeesWithoutCards={employeesWithoutCards}
        />
      </main>
    </div>
  );
}
