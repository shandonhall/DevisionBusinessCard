import Link from "next/link";
import { SignInForm } from "@/components/forms/sign-in-form";
import { ThemeToggleFloating } from "@/components/theme/theme-toggle-floating";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_NAME } from "@/lib/branding/platform";

export default function SignInPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <ThemeToggleFloating />
      <div className="space-y-2 text-center">
        <Link href="/" className="text-sm font-semibold text-[var(--brand-primary)]">
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-[var(--brand-muted-text)]">
          Organisation admins and platform operators
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Access is scoped to your organisation memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}
