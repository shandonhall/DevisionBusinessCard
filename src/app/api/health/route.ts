import { NextResponse } from "next/server";
import {
  getServerEnv,
  hasSupabasePublicConfig,
  hasSupabaseServiceRole,
} from "@/lib/validation/env";

export const runtime = "nodejs";

export async function GET() {
  const env = getServerEnv();

  return NextResponse.json({
    ok: true,
    service: env.NEXT_PUBLIC_PLATFORM_NAME,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    supabase: {
      publicConfig: hasSupabasePublicConfig(env),
      // Never reveal whether the service role key value is present beyond a boolean.
      serviceRoleConfigured: hasSupabaseServiceRole(env),
    },
  });
}
