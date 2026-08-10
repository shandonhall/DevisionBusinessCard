import dynamic from "next/dynamic";
import type { PublicCardViewModel } from "@/types/card";
import { CorporateLayout } from "@/components/cards/corporate-layout";
import { ExecutiveLayout } from "@/components/cards/executive-layout";
import { ModernLayout } from "@/components/cards/modern-layout";

const InteractiveCardExperience = dynamic(
  () =>
    import("@/components/experience/interactive-card-experience").then(
      (m) => m.InteractiveCardExperience,
    ),
  {
    loading: () => (
      <div
        className="min-h-screen"
        style={{ background: "var(--brand-background, #111)" }}
        aria-busy
      />
    ),
  },
);

/**
 * Single entry point for public + preview rendering.
 * Experience presets (e.g. dimension) take priority over legacy layout ids.
 */
export function PublicCardRenderer({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  if (model.brandDNA?.experience.preset === "dimension") {
    return (
      <InteractiveCardExperience
        model={model}
        absoluteCardUrl={absoluteCardUrl}
      />
    );
  }

  switch (model.card.layoutId) {
    case "executive":
      return (
        <ExecutiveLayout model={model} absoluteCardUrl={absoluteCardUrl} />
      );
    case "modern":
      return <ModernLayout model={model} absoluteCardUrl={absoluteCardUrl} />;
    case "corporate":
    default:
      return (
        <CorporateLayout model={model} absoluteCardUrl={absoluteCardUrl} />
      );
  }
}
