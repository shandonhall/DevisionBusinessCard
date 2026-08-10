/**
 * Platform operator branding (DeVision Media).
 * Overridable via NEXT_PUBLIC_PLATFORM_NAME for white-label deployments.
 */
export const PLATFORM_NAME =
  process.env.NEXT_PUBLIC_PLATFORM_NAME?.trim() || "DeVision Media";

export function poweredByPlatformLabel(name: string = PLATFORM_NAME) {
  return `Powered by ${name}`;
}
