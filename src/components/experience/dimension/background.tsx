"use client";

import type { BrandDNA, ExperienceQuality } from "@/lib/experience/types";

/**
 * Dark product-studio field - brand colour as off-canvas light only.
 * Parallax via CSS vars (--dim-px / --dim-py) on the shell.
 */
export function DimensionBackground({
  dna,
  quality,
}: {
  dna: BrandDNA;
  quality: ExperienceQuality;
}) {
  const chroma = dna.experience.chromaticIntensity;
  const ambient = quality === "full" && dna.experience.ambientMotion;
  const dark = dna.experience.environmentTone === "studio-dark";

  return (
    <div className="dim-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="dim-bg-base absolute inset-0"
        style={{
          background: dark
            ? `
              radial-gradient(85% 65% at 12% 8%, color-mix(in srgb, var(--brand-primary) ${18 * chroma}%, transparent), transparent 62%),
              radial-gradient(70% 55% at 92% 14%, color-mix(in srgb, var(--brand-accent) ${14 * chroma}%, transparent), transparent 58%),
              radial-gradient(75% 50% at 78% 92%, color-mix(in srgb, var(--brand-secondary) ${16 * chroma}%, transparent), transparent 60%),
              radial-gradient(50% 40% at 48% 48%, rgb(18 20 26 / 0.35), transparent 70%),
              linear-gradient(168deg, #030405 0%, #080a0d 42%, #050607 100%)
            `
            : `
              radial-gradient(120% 80% at 10% 0%, color-mix(in srgb, var(--brand-primary) 28%, transparent), transparent 55%),
              linear-gradient(160deg, color-mix(in srgb, var(--brand-background) 70%, #050505), var(--brand-background))
            `,
        }}
      />

      <div
        className={`dim-studio-light dim-studio-light-a ${ambient ? "dim-light-a" : ""}`}
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, var(--brand-primary) ${42 * chroma}%, transparent), transparent 72%)`,
          opacity: 0.5,
        }}
      />
      <div
        className={`dim-studio-light dim-studio-light-b ${ambient ? "dim-light-b" : ""}`}
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, var(--brand-accent) ${36 * chroma}%, transparent), transparent 74%)`,
          opacity: 0.4,
        }}
      />
      {quality === "full" ? (
        <div
          className={`dim-studio-light dim-studio-light-c ${ambient ? "dim-light-c" : ""}`}
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, var(--brand-secondary) ${32 * chroma}%, transparent), transparent 76%)`,
            opacity: 0.35,
          }}
        />
      ) : null}

      <div className="dim-bg-grain absolute inset-0" />
      <div className="dim-bg-vignette absolute inset-0" />
      <div className="dim-bg-floor absolute inset-x-0 bottom-0 h-[42%]" />
    </div>
  );
}
