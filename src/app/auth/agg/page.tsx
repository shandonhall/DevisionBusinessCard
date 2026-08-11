import { TenantSignInView } from "@/components/auth/tenant-sign-in-view";
import { resolveTenantLoginBrand } from "@/lib/branding/tenant-login";
import { notFound } from "next/navigation";

/**
 * Clean AGG admin login URL for demos / presentations.
 * Equivalent to /auth/sign-in?org=agg
 */
export default function AggSignInPage() {
  const brand = resolveTenantLoginBrand("agg");
  if (!brand) notFound();
  return <TenantSignInView brand={brand} />;
}
