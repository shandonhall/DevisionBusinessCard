import Link from "next/link";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { PLATFORM_NAME } from "@/lib/branding/platform";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--brand-primary)]"
        >
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-[var(--brand-muted-text)]">
          For team members invited by your organisation admin. This does not
          create an admin organisation.
        </p>
      </div>
      <SignUpForm />
    </main>
  );
}
