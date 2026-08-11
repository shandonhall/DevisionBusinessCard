"use client";

import { useRef } from "react";
import type { PublicCardViewModel } from "@/types/card";
import { PlatformPoweredBy } from "@/components/branding/platform-powered-by";
import { CardShell } from "@/components/card-sections/primitives";
import { useExperienceQuality } from "@/components/experience/hooks/use-experience-quality";
import { usePointerTilt } from "@/components/experience/hooks/use-pointer-tilt";
import { DriveBackground } from "@/components/experience/drive/background";
import { DriveIdentityCard } from "@/components/experience/drive/identity-card";
import { DriveContactDock } from "@/components/experience/drive/contact-dock";
import {
  getDriveMarqueConfig,
  type DriveMarqueId,
} from "@/lib/experience/drive-marque";

/**
 * Shared Drive engine - marque personality via Brand DNA / data-marque.
 * Never branches on organisation.name.
 */
export function DriveCardExperience({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  const dna = model.brandDNA;
  const marque: DriveMarqueId = dna.driveMarque ?? "agg";
  const marqueConfig = getDriveMarqueConfig(marque);
  const quality = useExperienceQuality(dna.experience.allowAdvancedEffects);
  const reducedMotion = quality === "essential";
  const interactive = !reducedMotion && dna.experience.tiltStrength > 0;
  const shellRef = useRef<HTMLDivElement>(null);

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
    "/brands/agg/agg-logo.png";

  return (
    <CardShell
      model={model}
      className="drive-shell relative isolate overflow-x-hidden"
      data-marque={marque}
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
        className="relative min-h-screen"
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

        <main className="drive-main relative z-[1] mx-auto flex w-full max-w-[30rem] flex-col gap-5 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.35rem,env(safe-area-inset-top))] sm:max-w-[34rem] sm:gap-6 sm:px-6 sm:pb-16 sm:pt-12 md:max-w-[38rem] md:gap-7 md:pt-14">
          <div className="drive-enter drive-enter-1">
            <DriveIdentityCard
              model={model}
              dna={dna}
              logoUrl={logoUrl}
              marque={marque}
              handlers={handlers}
              interactive={interactive}
              reducedMotion={reducedMotion}
            />
          </div>

          <div className="drive-enter drive-enter-2">
            <DriveContactDock
              model={model}
              absoluteCardUrl={absoluteCardUrl}
              websiteOverride={marqueConfig.website}
            />
          </div>

          <p className="drive-enter drive-enter-3 drive-tagline text-center">
            {marqueConfig.taglineHtml.lead}{" "}
            <strong>{marqueConfig.taglineHtml.strongA}</strong>
            {marqueConfig.taglineHtml.mid}{" "}
            <strong>{marqueConfig.taglineHtml.strongB}</strong>.
          </p>

          {!model.organisation.whiteLabelEnabled ? (
            <PlatformPoweredBy className="drive-enter drive-enter-3 text-center text-xs text-white/25" />
          ) : null}
        </main>
      </div>
    </CardShell>
  );
}
