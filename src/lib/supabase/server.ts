import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { hasSupabasePublicConfig } from "@/lib/validation/env";

/**
 * Server Supabase client bound to the user session cookies.
 * Respects RLS. Suitable for Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  if (!hasSupabasePublicConfig()) {
    // Avoid crashing static analysis / misconfigured deploys mid-render.
    redirect("/auth/sign-in");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Middleware refreshes sessions where needed.
        }
      },
    },
  });
}
