import { PLATFORM_NAME, poweredByPlatformLabel } from "@/lib/branding/platform";

export type TenantLoginBrand = {
  slug: string;
  organisationName: string;
  logoUrl: string;
  logoAlt: string;
  headline: string;
  description: string;
  poweredBy: string;
  /** Dark plate behind light-on-dark logos */
  logoOnDark: boolean;
};

const TENANT_LOGIN_BRANDS: Record<string, TenantLoginBrand> = {
  agg: {
    slug: "agg",
    organisationName: "AGG Motors",
    logoUrl: "/brands/agg/agg-logo.png",
    logoAlt: "AGG Motors",
    headline: "Sign in",
    description: "Sign in to AGG Motors",
    poweredBy: poweredByPlatformLabel(PLATFORM_NAME),
    logoOnDark: true,
  },
};

export function resolveTenantLoginBrand(
  orgSlug: string | null | undefined,
): TenantLoginBrand | null {
  if (!orgSlug) return null;
  const key = orgSlug.trim().toLowerCase();
  return TENANT_LOGIN_BRANDS[key] ?? null;
}
