import Image from "next/image";
import { SignInForm } from "@/components/forms/sign-in-form";
import type { TenantLoginBrand } from "@/lib/branding/tenant-login";

export function TenantSignInView({ brand }: { brand: TenantLoginBrand }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4 text-center">
        <div
          className={
            brand.logoOnDark
              ? "mx-auto flex w-full max-w-[12rem] items-center justify-center rounded-2xl bg-[#0b0d10] px-5 py-4 ring-1 ring-black/20"
              : "mx-auto flex w-full max-w-[12rem] items-center justify-center"
          }
        >
          <Image
            src={brand.logoUrl}
            alt={brand.logoAlt}
            width={180}
            height={96}
            priority
            className="h-auto w-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      </div>

      <SignInForm signUpHref="/auth/sign-up" />

      <p className="text-center text-xs tracking-wide text-[var(--brand-muted-text)]">
        {brand.poweredBy}
      </p>
    </main>
  );
}
