import { AppHeader } from "@/components/admin/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { listAccessibleOrganisations } from "@/lib/db/organisations";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const context = await requirePlatformAdmin();
  const organisations = await listAccessibleOrganisations();

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Platform admin"
        email={context.email}
        showAdminLink
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Organisations
          </h1>
          <p className="text-[var(--brand-muted-text)]">
            Platform super admins can view all tenants. Mark a profile with{" "}
            <code>is_platform_admin = true</code> in Supabase to grant access.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant directory</CardTitle>
            <CardDescription>
              {organisations.length} organisation
              {organisations.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--brand-border)] text-[var(--brand-muted-text)]">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Slug</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">White-label</th>
                  </tr>
                </thead>
                <tbody>
                  {organisations.map((org) => (
                    <tr key={org.id} className="border-b border-[var(--brand-border)]">
                      <td className="py-3 pr-4 font-medium">{org.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        /{org.slug}
                      </td>
                      <td className="py-3 pr-4">{org.status}</td>
                      <td className="py-3">
                        {org.white_label_enabled ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                  {organisations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-[var(--brand-muted-text)]"
                      >
                        No organisations yet. Sign up creates the first tenant.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
