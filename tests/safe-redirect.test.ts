import { describe, expect, it } from "vitest";
import { safeAuthRedirectPath } from "@/lib/auth/safe-redirect";

describe("safeAuthRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeAuthRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeAuthRedirectPath("/admin?tab=orgs")).toBe("/admin?tab=orgs");
  });

  it("rejects open redirects", () => {
    expect(safeAuthRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeAuthRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeAuthRedirectPath("\\\\evil.example")).toBe("/dashboard");
    expect(safeAuthRedirectPath("/\\evil.example")).toBe("/dashboard");
  });

  it("falls back for empty values", () => {
    expect(safeAuthRedirectPath(null)).toBe("/dashboard");
    expect(safeAuthRedirectPath("")).toBe("/dashboard");
    expect(safeAuthRedirectPath("  ", "/admin")).toBe("/admin");
  });
});
