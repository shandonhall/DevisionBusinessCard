import Link from "next/link";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { ThemeToggleFloating } from "@/components/theme/theme-toggle-floating";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_NAME } from "@/lib/branding/platform";

export default function SignUpPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <ThemeToggleFloating />
      <div className="space-y-2 text-center">
        <Link href="/" className="text-sm font-semibold text-[var(--brand-primary)]">
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Create your organisation
        </h1>
        <p className="text-[var(--brand-muted-text)]">
          White-label onboarding starts with a tenant and an organisation admin
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>
            No client branding is hard-coded — your organisation is data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}
