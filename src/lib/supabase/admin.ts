import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServerEnv, hasSupabaseServiceRole } from "@/lib/validation/env";

/**
 * Service-role client - bypasses RLS.
 * SERVER-ONLY. Never import this into Client Components or expose to the browser.
 * Use sparingly for trusted platform-admin / system operations after Milestone 1.
 */
export function createServiceRoleClient() {
  const env = getServerEnv();

  if (!hasSupabaseServiceRole(env) || !env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for service-role access",
    );
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
