"use client";

import { useRef } from "react";
import type { PublicCardViewModel } from "@/types/card";
import { PlatformPoweredBy } from "@/components/branding/platform-powered-by";
import { CardShell } from "@/components/card-sections/primitives";
import { useExperienceQuality } from "@/components/experience/hooks/use-experience-quality";
import { usePointerTilt } from "@/components/experience/hooks/use-pointer-tilt";
import { DimensionBackground } from "@/components/experience/dimension/background";
import { DimensionalIdentityCard } from "@/components/experience/dimension/identity-card";
import { DimensionContactInterface } from "@/components/experience/dimension/contact-interface";
import { usePublicAnalytics } from "@/components/experience/hooks/use-public-analytics";
import type { PublicAnalyticsContext } from "@/lib/analytics/types";

export function InteractiveCardExperience({
  model,
  absoluteCardUrl,
  analyticsContext = null,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
  analyticsContext?: PublicAnalyticsContext | null;
}) {
  const dna = model.brandDNA;
  const quality = useExperienceQuality(dna.experience.allowAdvancedEffects);
  const tracker = usePublicAnalytics(analyticsContext);
  const reducedMotion = quality === "essential";
  const interactive = !reducedMotion && dna.experience.tiltStrength > 0;
  const shellRef = useRef<HTMLDivElement>(null);

  const { handlers } = usePointerTilt({
    enabled: interactive,
    strength: dna.experience.tiltStrength,
    maxDegrees: quality === "full" ? 6.25 : 4.5,
    rootRef: shellRef,
  });

  const studioDark = dna.experience.environmentTone === "studio-dark";

  return (
    <CardShell
      model={model}
      className="dim-shell relative isolate overflow-x-hidden"
      style={
        studioDark
          ? {
              background: "#030405",
              color: "#f3f1ec",
            }
          : undefined
      }
    >
      <div
        ref={shellRef}
        className="relative min-h-screen"
        style={
          {
            "--dim-rx": "0",
            "--dim-ry": "0",
            "--dim-px": "0.5",
            "--dim-py": "0.5",
            "--dim-lx": "0.5",
            "--dim-ly": "0.38",
          } as React.CSSProperties
        }
      >
        <DimensionBackground dna={dna} quality={quality} />

        <main className="dim-main relative z-[1] mx-auto flex w-full max-w-[27rem] flex-col gap-8 px-4 pb-[max(3.75rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:max-w-2xl sm:gap-11 sm:px-6 sm:pb-20 sm:pt-14 md:max-w-[46rem] md:gap-12 md:pt-16">
          <div className="dim-enter dim-enter-1">
            <DimensionalIdentityCard
              model={model}
              dna={dna}
              handlers={handlers}
              interactive={interactive}
              reducedMotion={reducedMotion}
              absoluteCardUrl={absoluteCardUrl}
              onFlip={(to) => {
                tracker?.track({
                  eventType: "card_flip",
                  metadata: {
                    from: to === "back" ? "front" : "back",
                    to,
                  },
                });
              }}
            />
          </div>

          <div className="dim-enter dim-enter-2">
            <DimensionContactInterface
              model={model}
              absoluteCardUrl={absoluteCardUrl}
              tracker={tracker}
            />
          </div>

          {!model.organisation.whiteLabelEnabled ? (
            <PlatformPoweredBy className="dim-enter dim-enter-3 text-center text-xs text-white/30" />
          ) : null}
        </main>
      </div>
    </CardShell>
  );
}
