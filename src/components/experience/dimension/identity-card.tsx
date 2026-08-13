"use client";

import { useId, useState } from "react";
import { RefreshCw } from "lucide-react";
import { QrCodeBlock } from "@/components/cards/qr-code-block";
import type { BrandDNA } from "@/lib/experience/types";
import type { PublicCardViewModel } from "@/types/card";
import { withAttribution } from "@/lib/analytics/source";

function monogram(model: PublicCardViewModel) {
  return (
    `${model.employee.firstName[0] ?? ""}${model.employee.lastName[0] ?? ""}`.toUpperCase() ||
    "·"
  );
}

/**
 * Chromatic smoked-acrylic identity object - layered depth, true flip, integrated portrait.
 * Motion coordinates come from CSS vars (--dim-*) set by usePointerTilt on the shell.
 */
export function DimensionalIdentityCard({
  model,
  dna,
  handlers,
  interactive,
  reducedMotion,
  absoluteCardUrl,
  onFlip,
}: {
  model: PublicCardViewModel;
  dna: BrandDNA;
  handlers: {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: () => void;
  };
  interactive: boolean;
  reducedMotion: boolean;
  absoluteCardUrl: string;
  onFlip?: (next: "front" | "back") => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [hintSpent, setHintSpent] = useState(false);
  const labelId = useId();
  const chroma = dna.experience.chromaticIntensity;
  const reflection = dna.experience.reflectionStrength;
  const smoked = dna.visual.surfaceStyle === "smoked-acrylic";
  const embedded = dna.experience.logoTreatment === "embedded";
  const integrated =
    dna.experience.profileTreatment === "integrated" ||
    dna.visual.imageTreatment === "integrated";
  const hasPhoto = Boolean(model.employee.profilePhotoUrl);
  const company = model.brand?.name || model.organisation.name;
  const logoUrl = model.tokens.logoUrl;
  const corner =
    dna.visual.cornerStyle === "precision"
      ? "1rem"
      : dna.visual.cornerStyle === "soft"
        ? "1.25rem"
        : "1.1rem";

  function toggleFlip() {
    setFlipped((current) => {
      const next = !current;
      onFlip?.(next ? "back" : "front");
      return next;
    });
    setHintSpent(true);
  }

  return (
    <div className="dim-identity-stage relative mx-auto w-full max-w-[40rem]">
      <div className="dim-card-shadow" aria-hidden />
      <div
        className="dim-card-scene relative touch-none"
        {...(interactive ? handlers : {})}
      >
        <div
          className={`dim-card-present-wrap ${reducedMotion ? "dim-flip-instant" : ""}`}
        >
          <div
            className={`dim-card-tilt ${interactive && !reducedMotion ? "dim-card-tilt-live" : ""}`}
          >
            <div
              className={`dim-card-flipper ${flipped ? "is-flipped" : ""} ${reducedMotion ? "dim-flip-instant" : ""}`}
            >
            {/* Thickness / rear extrusion - reads under tilt */}
            <div className="dim-card-depth" aria-hidden style={{ borderRadius: corner }} />
            <div className="dim-card-depth dim-card-depth-b" aria-hidden style={{ borderRadius: corner }} />
            <div className="dim-card-rim dim-card-rim-left" aria-hidden />
            <div className="dim-card-rim dim-card-rim-right" aria-hidden />

            {/* FRONT */}
            <article
              className={`dim-card-face dim-card-face-front ${smoked ? "dim-face-smoked" : ""}`}
              aria-labelledby={labelId}
              aria-hidden={flipped}
              style={
                {
                  borderRadius: corner,
                  "--dim-chroma": String(chroma),
                  "--dim-reflect": String(reflection),
                } as React.CSSProperties
              }
            >
              <div className="dim-edge-ring" aria-hidden />
              <div className="dim-internal-wash" aria-hidden />
              <div className="dim-specular dim-specular-broad" aria-hidden />
              <div className="dim-specular dim-specular-narrow" aria-hidden />
              <div className="dim-grain" aria-hidden />
              <div className="dim-front-glass" aria-hidden />

              {/* Portrait - integrated into material, not a hard column */}
              <div
                className={`dim-portrait-layer ${integrated ? "dim-portrait-integrated" : ""}`}
                aria-hidden={!hasPhoto}
              >
                {hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={model.employee.profilePhotoUrl!}
                    alt=""
                    className="dim-portrait-img"
                  />
                ) : (
                  <div className="dim-portrait-fallback">
                    <span
                      className="dim-monogram"
                      style={{ fontFamily: "var(--brand-heading-font)" }}
                    >
                      {monogram(model)}
                    </span>
                  </div>
                )}
                <div className="dim-portrait-grade" />
                <div className="dim-portrait-veil" />
                <div className="dim-portrait-glass" />
              </div>

              {/* Identity copy */}
              <div className="dim-identity-layer">
                <div
                  className={`dim-logo-slot ${embedded ? "dim-logo-embedded" : ""}`}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={company}
                      className="dim-logo-img"
                    />
                  ) : (
                    <p
                      className="dim-logo-text"
                      style={{ fontFamily: "var(--brand-heading-font)" }}
                    >
                      {company}
                    </p>
                  )}
                </div>

                <div className="dim-copy-block">
                  <h1
                    id={labelId}
                    className="dim-name"
                    style={{ fontFamily: "var(--brand-heading-font)" }}
                  >
                    {model.employee.displayName}
                  </h1>
                  {model.employee.jobTitle ? (
                    <p className="dim-title">{model.employee.jobTitle}</p>
                  ) : null}
                  <p className="dim-company">{company}</p>
                </div>
              </div>
            </article>

            {/* BACK */}
            <div
              className={`dim-card-face dim-card-face-back ${smoked ? "dim-face-smoked" : ""}`}
              aria-hidden={!flipped}
              style={{ borderRadius: corner }}
            >
              <div className="dim-edge-ring" aria-hidden />
              <div className="dim-internal-wash" aria-hidden />
              <div className="dim-specular dim-specular-broad" aria-hidden />
              <div className="dim-grain" aria-hidden />

              <div className="dim-back-layout">
                <div className="dim-back-qr">
                  <p className="dim-back-label">Scan to save</p>
                  <div className="dim-back-qr-plate">
                    <QrCodeBlock
                      value={withAttribution(absoluteCardUrl, "qr")}
                      size={118}
                      title={`QR for ${model.employee.displayName}`}
                    />
                  </div>
                </div>
                <div className="dim-back-details">
                  <p
                    className="dim-back-name"
                    style={{ fontFamily: "var(--brand-heading-font)" }}
                  >
                    {model.employee.displayName}
                  </p>
                  <dl className="dim-back-dl">
                    {model.employee.mobile ? (
                      <div>
                        <dt>Phone</dt>
                        <dd>{model.employee.mobile}</dd>
                      </div>
                    ) : null}
                    {model.employee.email ? (
                      <div>
                        <dt>Email</dt>
                        <dd className="break-all">{model.employee.email}</dd>
                      </div>
                    ) : null}
                    {model.organisation.website || model.brand?.website ? (
                      <div>
                        <dt>Web</dt>
                        <dd className="truncate">
                          {(
                            model.brand?.website || model.organisation.website
                          )!.replace(/^https?:\/\//, "")}
                        </dd>
                      </div>
                    ) : null}
                    {model.location?.name ? (
                      <div>
                        <dt>Location</dt>
                        <dd>{model.location.name}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="dim-back-company">{company}</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dim-flip-row">
        <button
          type="button"
          className={`dim-flip-affordance ${!hintSpent && !flipped ? "dim-flip-hint" : ""}`}
          onClick={toggleFlip}
          aria-pressed={flipped}
          aria-label={flipped ? "Show front of card" : "Turn card over"}
        >
          <RefreshCw size={13} strokeWidth={1.75} aria-hidden />
          <span>{flipped ? "Front" : "Turn over"}</span>
        </button>
      </div>
    </div>
  );
}
