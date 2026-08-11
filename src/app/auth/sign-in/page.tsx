import Link from "next/link";
import { TenantSignInView } from "@/components/auth/tenant-sign-in-view";
import { SignInForm } from "@/components/forms/sign-in-form";
import { PLATFORM_NAME } from "@/lib/branding/platform";
import { resolveTenantLoginBrand } from "@/lib/branding/tenant-login";

type Props = {
  searchParams: Promise<{ org?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { org } = await searchParams;
  const tenantBrand = resolveTenantLoginBrand(org);

  if (tenantBrand) {
    return <TenantSignInView brand={tenantBrand} />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--brand-primary)]"
        >
          {PLATFORM_NAME}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      </div>
      <SignInForm />
    </main>
  );
}
