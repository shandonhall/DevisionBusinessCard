import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggleFloating } from "@/components/theme/theme-toggle-floating";
import { getServerEnv, hasSupabasePublicConfig } from "@/lib/validation/env";

export default function HomePage() {
  const env = getServerEnv();
  const supabaseReady = hasSupabasePublicConfig(env);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <ThemeToggleFloating />
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
          Milestone 1 · Auth + Tenancy
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--brand-text)] sm:text-5xl">
          {env.NEXT_PUBLIC_PLATFORM_NAME}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--brand-muted-text)]">
          Multi-tenant white-label digital business cards. Sign in to access
          your organisation dashboard — never another tenant&apos;s data.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/auth/sign-up">Create organisation</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api/health">Health check</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tenancy</CardTitle>
            <CardDescription>
              Organisations + memberships with RLS
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--brand-muted-text)]">
            Server helpers and database policies both enforce organisation
            boundaries.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Supabase Auth</CardTitle>
            <CardDescription>
              {supabaseReady ? "Public config detected" : "Add keys in .env.local"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--brand-muted-text)]">
            Apply{" "}
            <code>supabase/migrations/20260310140000_organisations_memberships.sql</code>{" "}
            to your project, then sign up.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Organisation admin + platform super admin
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--brand-muted-text)]">
            Platform access requires <code>profiles.is_platform_admin</code>.
            UI hiding alone is never trusted.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
