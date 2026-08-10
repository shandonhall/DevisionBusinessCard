import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getServerEnv,
  hasSupabasePublicConfig,
  resetServerEnvCache,
} from "@/lib/validation/env";

describe("env validation", () => {
  const original = { ...process.env };

  beforeEach(() => {
    resetServerEnvCache();
    process.env.NEXT_PUBLIC_PLATFORM_NAME = "Test Platform";
    process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = "example.test";
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...original };
    resetServerEnvCache();
  });

  it("loads platform defaults without Supabase credentials", () => {
    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_PLATFORM_NAME).toBe("Test Platform");
    expect(hasSupabasePublicConfig(env)).toBe(false);
  });
});
