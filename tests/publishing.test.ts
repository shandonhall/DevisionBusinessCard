import { describe, expect, it } from "vitest";
import {
  isPubliclyReachableStatus,
  parsePublicCardResolution,
} from "@/lib/cards/resolve-public";
import type { Json } from "@/types/database";

describe("isPubliclyReachableStatus", () => {
  it("maps publishing statuses to public behaviour", () => {
    expect(isPubliclyReachableStatus("active")).toBe("render");
    expect(isPubliclyReachableStatus("paused")).toBe("paused");
    expect(isPubliclyReachableStatus("draft")).toBe("hidden");
    expect(isPubliclyReachableStatus("archived")).toBe("hidden");
  });
});

describe("parsePublicCardResolution", () => {
  it("parses redirect payloads", () => {
    const result = parsePublicCardResolution({
      type: "redirect",
      organisation_slug: "acme",
      to_slug: "jane-doe",
    } as Json);

    expect(result).toEqual({
      type: "redirect",
      organisationSlug: "acme",
      toSlug: "jane-doe",
    });
  });

  it("parses paused payloads", () => {
    const result = parsePublicCardResolution({
      type: "paused",
      organisation: {
        name: "Acme",
        slug: "acme",
        white_label_enabled: false,
      },
      message: "This card is temporarily unavailable.",
    } as Json);

    expect(result).toEqual({
      type: "paused",
      organisation: {
        name: "Acme",
        slug: "acme",
        whiteLabelEnabled: false,
      },
      message: "This card is temporarily unavailable.",
    });
  });

  it("returns missing for draft-style empty payloads", () => {
    expect(parsePublicCardResolution({ type: "missing" } as Json)).toEqual({
      type: "missing",
    });
    expect(parsePublicCardResolution(null)).toEqual({ type: "missing" });
    expect(
      parsePublicCardResolution({
        type: "redirect",
        organisation_slug: "acme",
      } as Json),
    ).toEqual({ type: "missing" });
  });
});
