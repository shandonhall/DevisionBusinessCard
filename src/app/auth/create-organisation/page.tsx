import Link from "next/link";
import { CreateOrganisationForm } from "@/components/forms/create-organisation-form";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { PLATFORM_NAME } from "@/lib/branding/platform";

/**
 * Platform onboarding only - creates a tenant.
 * Requires an existing Platform Admin session (no public self-serve tenants).
 */
export default async function CreateOrganisationPage() {
  await requirePlatformAdmin();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2 text-center">
        <Link
          href="/admin"
          className="text-sm font-semibold text-[var(--brand-primary)]"
        >
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create organisation
        </h1>
        <p className="text-sm text-[var(--brand-muted-text)]">
          Platform onboarding for a new white-label tenant. Only DeVision
          Platform Admins can create organisations.
        </p>
      </div>
      <CreateOrganisationForm />
      <p className="text-center text-sm text-[var(--brand-muted-text)]">
        <Link href="/admin" className="underline-offset-4 hover:underline">
          Back to platform admin
        </Link>
      </p>
    </main>
  );
}
