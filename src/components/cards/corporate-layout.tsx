import type { CSSProperties } from "react";
import type { PublicCardViewModel } from "@/types/card";
import { PlatformPoweredBy } from "@/components/branding/platform-powered-by";
import { CardActionBar } from "@/components/card-sections/card-action-bar";
import {
  AboutSection,
  BrandLogo,
  CardShell,
  ContactActionRow,
  IdentityBlock,
  PrimaryCta,
  ProfileImage,
  SocialLinks,
} from "@/components/card-sections/primitives";

/**
 * Corporate: a tall layered masthead with subtle texture, and an identity
 * panel that overlaps it like a stack of physical business cards.
 */
export function CorporateLayout({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  return (
    <CardShell model={model}>
      {/* Masthead: brand gradient + faint diagonal texture + drifting glow. */}
      <div
        className="relative h-40 w-full overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-secondary) 80%, black))",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(-55deg, rgb(255 255 255 / 0.045) 0 2px, transparent 2px 14px)",
          }}
        />
        <div
          aria-hidden
          className="card-drift absolute -top-16 right-[-10%] h-56 w-56 rounded-full blur-2xl"
          style={{
            background: "color-mix(in srgb, var(--brand-accent) 30%, transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, var(--brand-background) 35%, transparent))",
          }}
        />
      </div>

      <main className="relative mx-auto -mt-20 flex w-full max-w-md flex-col gap-6 px-4 pb-12 sm:px-5">
        {/* Identity panel with a rotated backing card for stacked depth. */}
        <div className="card-enter relative">
          <div
            aria-hidden
            className="absolute inset-0 -rotate-2 translate-y-1.5 rounded-[var(--brand-card-radius)] opacity-80 shadow-md"
            style={{
              background:
                "color-mix(in srgb, var(--brand-surface) 72%, var(--brand-primary))",
            }}
          />
          <div
            className="depth-panel relative rounded-[var(--brand-card-radius)] border p-5"
            style={{
              background: "var(--brand-surface)",
              borderColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
            }}
          >
            <div className="mb-5">
              <BrandLogo model={model} />
            </div>
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 rounded-[calc(var(--brand-button-radius)+2px)] p-[2px]"
                style={{
                  background:
                    "linear-gradient(150deg, var(--brand-primary), var(--brand-accent))",
                }}
              >
                <div className="card-sheen h-20 w-20 overflow-hidden rounded-[var(--brand-button-radius)]">
                  <ProfileImage model={model} />
                </div>
              </div>
              <IdentityBlock model={model} align="left" />
            </div>
          </div>
        </div>

        <div
          className="card-enter flex flex-col gap-4"
          style={{ "--enter-delay": "0.1s" } as CSSProperties}
        >
          <CardActionBar model={model} absoluteCardUrl={absoluteCardUrl} />
          <PrimaryCta model={model} />
          <ContactActionRow model={model} />
        </div>

        <div
          className="card-enter flex flex-col gap-6"
          style={{ "--enter-delay": "0.18s" } as CSSProperties}
        >
          <AboutSection model={model} />
          <SocialLinks model={model} />
        </div>

        {!model.organisation.whiteLabelEnabled ? (
          <PlatformPoweredBy style={{ color: "var(--brand-muted-text)" }} />
        ) : null}
      </main>
    </CardShell>
  );
}
