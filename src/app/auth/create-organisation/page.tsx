import Link from "next/link";
import { CreateOrganisationSignUpForm } from "@/components/forms/create-organisation-sign-up-form";
import { PLATFORM_NAME } from "@/lib/branding/platform";

/**
 * Platform onboarding only - creates a tenant + organisation admin.
 * Not linked from AGG / client sign-in screens.
 */
export default function CreateOrganisationPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--brand-primary)]"
        >
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create organisation
        </h1>
        <p className="text-sm text-[var(--brand-muted-text)]">
          Platform onboarding for a new white-label tenant and its first admin.
        </p>
      </div>
      <CreateOrganisationSignUpForm />
    </main>
  );
}
