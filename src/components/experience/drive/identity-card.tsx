"use client";

import { useId, useRef, useState } from "react";
import type { BrandDNA } from "@/lib/experience/types";
import type { DriveMarqueId } from "@/lib/experience/drive-marque";
import {
  getDriveMarqueConfig,
  isVehicleMarqueSlug,
} from "@/lib/experience/drive-marque";
import type { PublicCardViewModel } from "@/types/card";
import { DriveCardReverse } from "@/components/experience/drive/drive-card-reverse";

function monogram(model: PublicCardViewModel) {
  return (
    `${model.employee.firstName[0] ?? ""}${model.employee.lastName[0] ?? ""}`.toUpperCase() ||
    "·"
  );
}

/**
 * Shared Drive identity object - content rules depend on resolved driveMarque.
 * Physical front/back flip uses CSS 3D (same pattern as Dimension).
 */
export function DriveIdentityCard({
  model,
  dna,
  logoUrl,
  marque,
  handlers,
  interactive,
  reducedMotion,
  qrValue,
  onFlip,
}: {
  model: PublicCardViewModel;
  dna: BrandDNA;
  logoUrl?: string;
  marque: DriveMarqueId;
  handlers: {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: () => void;
  };
  interactive: boolean;
  reducedMotion: boolean;
  qrValue: string;
  onFlip?: (next: "front" | "back") => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0, moved: false });
  const labelId = useId();
  const hasPhoto = Boolean(model.employee.profilePhotoUrl);
  const marqueConfig = getDriveMarqueConfig(marque);
  const isSingleMarque = marque !== "agg";

  const locationLine = (() => {
    if (!isSingleMarque) {
      return model.location?.name || model.organisation.name;
    }
    const loc = model.location?.name;
    if (!loc) return `${marqueConfig.label} · ${model.organisation.name}`;
    if (loc.toLowerCase().includes(marqueConfig.label.toLowerCase())) return loc;
    return `${marqueConfig.label} ${loc.replace(/^AGG\s+/i, "")}`;
  })();

  const multiMarques = isSingleMarque
    ? []
    : model.marques.filter((m) => isVehicleMarqueSlug(m.slug));

  function toggleFlip() {
    setFlipped((current) => {
      const next = !current;
      onFlip?.(next ? "back" : "front");
      return next;
    });
  }

  function onCardPointerDown(event: React.PointerEvent<HTMLElement>) {
    pointerRef.current = { x: event.clientX, y: event.clientY, moved: false };
  }

  function onCardPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (interactive) handlers.onPointerMove(event);
    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    if (Math.hypot(dx, dy) > 10) pointerRef.current.moved = true;
  }

  function onCardClick() {
    if (pointerRef.current.moved) return;
    toggleFlip();
  }

  function onCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  }

  return (
    <div className="drive-identity-stage relative mx-auto w-full">
      <div className="drive-card-shadow drive-card-shadow--ambient" aria-hidden />
      <div className="drive-card-shadow drive-card-shadow--contact" aria-hidden />
      <div className="drive-card-shadow drive-card-shadow--bounce" aria-hidden />

      <div
        className="drive-card-scene drive-card-scene--flip relative touch-none"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Show front of card" : "Turn card over"}
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMove}
        onPointerLeave={interactive ? handlers.onPointerLeave : undefined}
        onTouchStart={interactive ? handlers.onTouchStart : undefined}
        onTouchMove={interactive ? handlers.onTouchMove : undefined}
        onTouchEnd={interactive ? handlers.onTouchEnd : undefined}
        onClick={onCardClick}
        onKeyDown={onCardKeyDown}
      >
        <div
          className={`drive-card-present ${reducedMotion ? "drive-card-present--static" : ""}`}
        >
          <div
            className={`drive-card-tilt ${interactive && !reducedMotion ? "drive-card-tilt--live" : ""}`}
          >
            <div
              className={`drive-card-flipper ${flipped ? "is-flipped" : ""} ${reducedMotion ? "drive-flip-instant" : ""}`}
            >
              <article
                className="drive-card drive-card--front"
                aria-hidden={flipped}
                inert={flipped}
                aria-labelledby={labelId}
                style={
                  {
                    "--drive-reflect": String(dna.experience.reflectionStrength),
                  } as React.CSSProperties
                }
              >
                <div className="drive-card__underside" aria-hidden />
                <div className="drive-card__depth" aria-hidden />
                <div className="drive-card__edge" aria-hidden />

                <div className="drive-card__body">
                  <div className="drive-card__base" aria-hidden />
                  <div className="drive-card__grain" aria-hidden />
                  <div className="drive-card__falloff" aria-hidden />
                  <div className="drive-card__rim" aria-hidden />

                  <div className="drive-card__badge">
                    {marqueConfig.wordmark ? (
                      <p
                        className="drive-card__badge-wordmark"
                        aria-label={marqueConfig.label}
                      >
                        {marqueConfig.wordmark}
                      </p>
                    ) : logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={marqueConfig.label}
                        className={`drive-card__badge-logo${
                          marque === "mg" || marque === "jac"
                            ? " drive-card__badge-logo--mark"
                            : ""
                        }`}
                        width={160}
                        height={160}
                      />
                    ) : (
                      <p
                        className="drive-card__badge-wordmark"
                        aria-label={marqueConfig.label}
                      >
                        {marqueConfig.label}
                      </p>
                    )}
                  </div>

                  <div className="drive-card__layout">
                    <div className="drive-portrait">
                      <div className="drive-portrait__well" aria-hidden />
                      {hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={model.employee.profilePhotoUrl!}
                          alt=""
                          className="drive-portrait__img"
                        />
                      ) : (
                        <div className="drive-monogram" aria-hidden>
                          <div className="drive-monogram__inset" />
                          <div className="drive-monogram__shine" />
                          <span className="drive-monogram__glyph">
                            {monogram(model)}
                          </span>
                        </div>
                      )}
                      <div className="drive-portrait__grade" aria-hidden />
                      <div className="drive-portrait__coat" aria-hidden />
                      <div className="drive-portrait__rim" aria-hidden />
                    </div>

                    <div className="drive-identity">
                      <h1 id={labelId} className="drive-name">
                        {model.employee.displayName}
                      </h1>
                      {model.employee.jobTitle ? (
                        <p className="drive-title">{model.employee.jobTitle}</p>
                      ) : null}
                      <p className="drive-location">{locationLine}</p>
                      {isSingleMarque ? (
                        <p className="drive-group-context">
                          Part of {model.organisation.name}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {multiMarques.length > 1 ? (
                    <ul className="drive-marques" aria-label="Represented brands">
                      {multiMarques.map((item) => (
                        <li key={item.id} className="drive-marque">
                          <span className="drive-marque__text">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="drive-card__softbox" aria-hidden />
                  <div className="drive-card__specular" aria-hidden />
                  <div
                    className={`drive-card__sweep ${reducedMotion ? "drive-card__sweep--off" : ""}`}
                    aria-hidden
                  />
                  <div className="drive-card__clearcoat" aria-hidden />
                </div>
              </article>

              <article
                className="drive-card drive-card--back"
                aria-hidden={!flipped}
                inert={!flipped}
                style={
                  {
                    "--drive-reflect": String(dna.experience.reflectionStrength),
                  } as React.CSSProperties
                }
              >
                <div className="drive-card__underside" aria-hidden />
                <div className="drive-card__depth" aria-hidden />
                <div className="drive-card__edge" aria-hidden />
                <div className="drive-card__body">
                  <div className="drive-card__base" aria-hidden />
                  <div className="drive-card__grain" aria-hidden />
                  <div className="drive-card__falloff" aria-hidden />
                  <div className="drive-card__rim" aria-hidden />
                  <DriveCardReverse model={model} qrValue={qrValue} />
                  <div className="drive-card__softbox" aria-hidden />
                  <div className="drive-card__specular" aria-hidden />
                  <div className="drive-card__clearcoat" aria-hidden />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
