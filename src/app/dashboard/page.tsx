import Link from "next/link";
import { AppHeader } from "@/components/admin/app-header";
import { CreateOrganisationForm } from "@/components/forms/create-organisation-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPrimaryOrganisation,
  requireAuthContext,
} from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/permissions/tenancy";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  const isPlatformAdmin = canAccessPlatformAdmin(context.profile);
  const membershipRole =
    context.memberships.find((m) => m.organisation_id === organisation?.id)
      ?.role ?? "member";

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Dashboard"
        email={context.email}
        showAdminLink={isPlatformAdmin}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-text)] sm:text-3xl">
            {`Welcome${context.profile.full_name ? `, ${context.profile.full_name}` : ""}`}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--brand-muted-text)]">
            Your access is limited to organisations you belong to. Cross-tenant
            reads are blocked by RLS and server checks.
          </p>
        </div>

        {organisation ? (
          <Card>
            <CardHeader>
              <CardTitle>{organisation.name}</CardTitle>
              <CardDescription>
                Slug <code className="text-[var(--brand-text)]">/{organisation.slug}</code>{" "}
                · Status{" "}
                <span className="font-medium text-[var(--brand-text)]">
                  {organisation.status}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--brand-text)]">
              <p>
                Role:{" "}
                <strong className="font-semibold">{membershipRole}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/dashboard/cards">Manage cards</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/team">Team</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/brands">Brands</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/brand">Brand kit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No organisation yet</CardTitle>
              <CardDescription>
                Create your organisation to unlock Team, Cards, Brands, and the
                rest of the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOrganisationForm
                defaultName={context.profile.full_name ?? ""}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
            <CardDescription>
              {context.memberships.length} organisation
              {context.memberships.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[var(--brand-text)]">
              {context.memberships.map((membership) => {
                const isPrimary =
                  organisation?.id === membership.organisation_id;
                return (
                  <li
                    key={membership.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--brand-border)] py-2 last:border-0"
                  >
                    <span className="font-medium">
                      {isPrimary && organisation
                        ? organisation.name
                        : `Organisation ${membership.organisation_id.slice(0, 8)}`}
                    </span>
                    <span className="text-[var(--brand-muted-text)]">
                      {membership.role}
                    </span>
                  </li>
                );
              })}
              {context.memberships.length === 0 ? (
                <li className="text-[var(--brand-muted-text)]">None</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
