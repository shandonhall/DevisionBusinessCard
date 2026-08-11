import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerEnv, hasSupabasePublicConfig } from "@/lib/validation/env";

export default function HomePage() {
  const env = getServerEnv();
  const supabaseReady = hasSupabasePublicConfig(env);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--brand-text)] sm:text-5xl">
          {env.NEXT_PUBLIC_PLATFORM_NAME}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--brand-muted-text)]">
          Digital business cards for organisations and teams. Sign in with the
          account your admin provided — or create a staff account if you were
          already added on Team.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/agg">AGG sign in</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff accounts</CardTitle>
            <CardDescription>
              Sign up only creates a login — not an organisation admin
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--brand-muted-text)]">
            Admins invite people on Team first. Matching work email links your
            card after you sign up or sign in.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              {supabaseReady ? "Connected" : "Add keys in .env.local"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--brand-muted-text)]">
            Auth and tenancy are enforced server-side. Cross-tenant reads are
            blocked.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
