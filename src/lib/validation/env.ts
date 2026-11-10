import { z } from "zod";

/**
 * Server-side environment validation.
 * Never import this module from Client Components - it may read service-role secrets.
 */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_PLATFORM_NAME: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("DeVision Media"),
  ),
  NEXT_PUBLIC_PLATFORM_BASE_DOMAIN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("localhost:3000"),
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_PASS_TYPE_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_TEAM_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_SIGNER_CERT: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_SIGNER_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_SIGNER_KEY_PASSPHRASE: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  APPLE_WALLET_WWDR_CERT: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_PLATFORM_NAME: process.env.NEXT_PUBLIC_PLATFORM_NAME,
    NEXT_PUBLIC_PLATFORM_BASE_DOMAIN:
      process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APPLE_WALLET_PASS_TYPE_ID: process.env.APPLE_WALLET_PASS_TYPE_ID,
    APPLE_WALLET_TEAM_ID: process.env.APPLE_WALLET_TEAM_ID,
    APPLE_WALLET_SIGNER_CERT: process.env.APPLE_WALLET_SIGNER_CERT,
    APPLE_WALLET_SIGNER_KEY: process.env.APPLE_WALLET_SIGNER_KEY,
    APPLE_WALLET_SIGNER_KEY_PASSPHRASE:
      process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE,
    APPLE_WALLET_WWDR_CERT: process.env.APPLE_WALLET_WWDR_CERT,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function hasSupabasePublicConfig(env: ServerEnv = getServerEnv()) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseServiceRole(env: ServerEnv = getServerEnv()) {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL);
}

export type AppleWalletConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase?: string;
  wwdr: string;
};

/**
 * Accepts a PEM pasted with real or escaped (`\n`) newlines, or the whole
 * PEM base64-encoded on one line (easiest to paste into Vercel).
 */
export function decodePemEnv(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("-----BEGIN")) return trimmed.replace(/\\n/g, "\n");
  return Buffer.from(trimmed, "base64").toString("utf8");
}

export function getAppleWalletConfig(
  env: ServerEnv = getServerEnv(),
): AppleWalletConfig | null {
  if (
    !env.APPLE_WALLET_PASS_TYPE_ID ||
    !env.APPLE_WALLET_TEAM_ID ||
    !env.APPLE_WALLET_SIGNER_CERT ||
    !env.APPLE_WALLET_SIGNER_KEY ||
    !env.APPLE_WALLET_WWDR_CERT
  ) {
    return null;
  }
  return {
    passTypeIdentifier: env.APPLE_WALLET_PASS_TYPE_ID,
    teamIdentifier: env.APPLE_WALLET_TEAM_ID,
    signerCert: decodePemEnv(env.APPLE_WALLET_SIGNER_CERT),
    signerKey: decodePemEnv(env.APPLE_WALLET_SIGNER_KEY),
    signerKeyPassphrase: env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE,
    wwdr: decodePemEnv(env.APPLE_WALLET_WWDR_CERT),
  };
}

export function hasAppleWalletConfig(env: ServerEnv = getServerEnv()) {
  return getAppleWalletConfig(env) !== null;
}

/** Test helper - clears memoised env between cases. */
export function resetServerEnvCache() {
  cachedEnv = null;
}
