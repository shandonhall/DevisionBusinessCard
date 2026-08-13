"use client";

import { useRef } from "react";
import type { PublicCardViewModel } from "@/types/card";
import { PlatformPoweredBy } from "@/components/branding/platform-powered-by";
import { CardShell } from "@/components/card-sections/primitives";
import { useExperienceQuality } from "@/components/experience/hooks/use-experience-quality";
import { usePointerTilt } from "@/components/experience/hooks/use-pointer-tilt";
import { usePresentationMode } from "@/components/experience/hooks/use-presentation-mode";
import { DriveBackground } from "@/components/experience/drive/background";
import { DriveIdentityCard } from "@/components/experience/drive/identity-card";
import { DriveContactDock } from "@/components/experience/drive/contact-dock";
import { DriveStudioFrame } from "@/components/experience/drive/drive-studio-frame";
import { DriveCampaignSlot } from "@/components/experience/drive/drive-campaign-slot";
import {
  getDriveMarqueConfig,
  type DriveMarqueId,
} from "@/lib/experience/drive-marque";
import type { ResolvedCampaign } from "@/lib/campaigns/types";
import type { PublicAnalyticsContext } from "@/lib/analytics/types";
import { usePublicAnalytics } from "@/components/experience/hooks/use-public-analytics";
import { withAttribution } from "@/lib/analytics/source";

/**
 * Shared Drive engine - marque personality via Brand DNA / data-marque.
 * Never branches on organisation.name.
 */
export function DriveCardExperience({
  model,
  absoluteCardUrl,
  campaigns = [],
  analyticsContext = null,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
  campaigns?: ResolvedCampaign[];
  analyticsContext?: PublicAnalyticsContext | null;
}) {
  const dna = model.brandDNA;
  const marque: DriveMarqueId = dna.driveMarque ?? "agg";
  const marqueConfig = getDriveMarqueConfig(marque);
  const quality = useExperienceQuality(dna.experience.allowAdvancedEffects);
  const shellRef = useRef<HTMLDivElement>(null);
  const presentation = usePresentationMode(shellRef);
  const tracker = usePublicAnalytics(analyticsContext);
  const reducedMotion = quality === "essential";
  const interactive = !reducedMotion && dna.experience.tiltStrength > 0;

  const { handlers } = usePointerTilt({
    enabled: interactive,
    strength: dna.experience.tiltStrength,
    maxDegrees: quality === "full" ? 5.75 : 4.25,
    rootRef: shellRef,
  });

  const logoUrl =
    marqueConfig.logoPath ||
    model.tokens.logoUrl ||
    model.brand?.logoUrl ||
    undefined;

  const leftCampaign = campaigns.find((item) => item.placement === "desktop_left");
  const rightCampaign = campaigns.find(
    (item) => item.placement === "desktop_right",
  );

  return (
    <CardShell
      model={model}
      className="drive-shell relative isolate overflow-x-hidden"
      data-marque={marque}
      data-presentation={presentation}
      style={{
        background: model.tokens.background,
        color: model.tokens.text,
        ["--brand-heading-font" as string]: `"${marqueConfig.headingFont}", var(--font-heading), sans-serif`,
        ["--brand-body-font" as string]: `"${marqueConfig.bodyFont}", var(--font-body), sans-serif`,
        ["--drive-champagne" as string]: model.tokens.accent,
      }}
    >
      <div
        ref={shellRef}
        className="drive-stage relative min-h-screen"
        style={
          {
            "--dim-rx": "1.2",
            "--dim-ry": "-2.4",
            "--dim-px": "0.48",
            "--dim-py": "0.46",
            "--dim-lx": "0.42",
            "--dim-ly": "0.32",
            "--drive-reflect": String(dna.experience.reflectionStrength),
            "--drive-chroma": String(dna.experience.chromaticIntensity),
          } as React.CSSProperties
        }
      >
        <DriveBackground dna={dna} quality={quality} />

        <main className="drive-main relative z-[1] w-full px-4 py-[max(1.35rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
          <DriveStudioFrame
            presentation={presentation}
            leftSlot={
              leftCampaign ? (
                <DriveCampaignSlot
                  campaign={leftCampaign}
                  tracker={tracker}
                />
              ) : null
            }
            rightSlot={
              rightCampaign ? (
                <DriveCampaignSlot
                  campaign={rightCampaign}
                  tracker={tracker}
                />
              ) : null
            }
            card={
              <DriveIdentityCard
                model={model}
                dna={dna}
                logoUrl={logoUrl}
                marque={marque}
                handlers={handlers}
                interactive={interactive}
                reducedMotion={reducedMotion}
                qrValue={withAttribution(absoluteCardUrl, "qr")}
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
            }
            dock={
              <DriveContactDock
                model={model}
                absoluteCardUrl={absoluteCardUrl}
                websiteOverride={marqueConfig.website}
                tracker={tracker}
              />
            }
            footer={
              <>
                <p className="drive-tagline text-center">
                  {marqueConfig.taglineHtml.lead}{" "}
                  <strong>{marqueConfig.taglineHtml.strongA}</strong>
                  {marqueConfig.taglineHtml.mid}{" "}
                  <strong>{marqueConfig.taglineHtml.strongB}</strong>.
                </p>
                {!model.organisation.whiteLabelEnabled ? (
                  <PlatformPoweredBy className="mt-3 text-center text-xs text-white/25" />
                ) : null}
              </>
            }
          />
        </main>
      </div>
    </CardShell>
  );
}
