import type { Json } from "@/types/database";
import {
  parsePublicCardPayload,
  toPublicCardViewModel,
} from "@/lib/cards/public-card";
import type { PublicCardViewModel } from "@/types/card";

export type PublicCardResolution =
  | { type: "active"; view: PublicCardViewModel }
  | {
      type: "paused";
      organisation: {
        name: string;
        slug: string;
        whiteLabelEnabled: boolean;
      };
      message: string;
    }
  | {
      type: "redirect";
      organisationSlug: string;
      toSlug: string;
    }
  | { type: "missing" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePublicCardResolution(
  raw: Json | null,
): PublicCardResolution {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    return { type: "missing" };
  }

  if (raw.type === "redirect") {
    if (
      typeof raw.organisation_slug === "string" &&
      typeof raw.to_slug === "string"
    ) {
      return {
        type: "redirect",
        organisationSlug: raw.organisation_slug,
        toSlug: raw.to_slug,
      };
    }
    return { type: "missing" };
  }

  if (raw.type === "paused") {
    const organisation = isRecord(raw.organisation) ? raw.organisation : null;
    if (
      organisation &&
      typeof organisation.name === "string" &&
      typeof organisation.slug === "string"
    ) {
      return {
        type: "paused",
        organisation: {
          name: organisation.name,
          slug: organisation.slug,
          whiteLabelEnabled: Boolean(organisation.white_label_enabled),
        },
        message:
          typeof raw.message === "string"
            ? raw.message
            : "This card is temporarily unavailable.",
      };
    }
    return { type: "missing" };
  }

  if (raw.type === "active") {
    const payload = parsePublicCardPayload(
      (raw.payload ?? null) as Json | null,
    );
    if (!payload) return { type: "missing" };
    return { type: "active", view: toPublicCardViewModel(payload) };
  }

  return { type: "missing" };
}

/** Pure helper for tests - draft/archived must never be treated as public. */
export function isPubliclyReachableStatus(
  status: "draft" | "active" | "paused" | "archived",
): "render" | "paused" | "hidden" {
  if (status === "active") return "render";
  if (status === "paused") return "paused";
  return "hidden";
}
