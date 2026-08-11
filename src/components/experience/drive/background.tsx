"use client";

import type { BrandDNA, ExperienceQuality } from "@/lib/experience/types";

/**
 * Dark automotive studio - softbox, champagne key, cool fill, floor bounce.
 */
export function DriveBackground({
  dna,
  quality,
}: {
  dna: BrandDNA;
  quality: ExperienceQuality;
}) {
  const ambient = quality !== "essential" && dna.experience.ambientMotion;
  const parallax = quality === "full" && ambient;

  return (
    <div
      className={`drive-bg pointer-events-none absolute inset-0 overflow-hidden ${parallax ? "drive-bg--parallax" : ""}`}
      aria-hidden
    >
      <div className="drive-bg__base" />
      <div className="drive-bg__key" />
      <div
        className={`drive-bg__softbox ${ambient ? "drive-bg__softbox--live" : ""}`}
      />
      <div className="drive-bg__fill" />
      <div className="drive-bg__halo" />
      <div className="drive-bg__champagne" />
      <div className="drive-bg__floor" />
      <div className="drive-bg__floor-gloss" />
      <div className="drive-bg__vignette" />
    </div>
  );
}
