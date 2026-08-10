import { NextResponse } from "next/server";
import { completePendingOrganisationSetup } from "@/lib/auth/complete-org-setup";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        try {
          await completePendingOrganisationSetup(data.user);
        } catch {
          // User can finish setup from the dashboard.
        }
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/auth/sign-in?error=auth_callback", origin),
  );
}
