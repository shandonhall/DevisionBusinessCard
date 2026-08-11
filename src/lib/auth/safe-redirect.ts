/**
 * Restrict auth callback `next` to same-origin relative paths.
 * Rejects protocol-relative URLs, absolute URLs, and backslash tricks.
 */
export function safeAuthRedirectPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
