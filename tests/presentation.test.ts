import { describe, expect, it } from "vitest";
import { presentationModeFromWidth } from "@/lib/experience/presentation";

describe("presentation modes", () => {
  it("uses mobile below 768", () => {
    expect(presentationModeFromWidth(320)).toBe("mobile");
    expect(presentationModeFromWidth(430)).toBe("mobile");
    expect(presentationModeFromWidth(767)).toBe("mobile");
  });

  it("uses tablet between 768 and 1199", () => {
    expect(presentationModeFromWidth(768)).toBe("tablet");
    expect(presentationModeFromWidth(1024)).toBe("tablet");
    expect(presentationModeFromWidth(1199)).toBe("tablet");
  });

  it("uses desktop studio from 1200", () => {
    expect(presentationModeFromWidth(1200)).toBe("desktop");
    expect(presentationModeFromWidth(1920)).toBe("desktop");
  });
});
