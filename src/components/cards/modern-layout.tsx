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
 * Modern: a full-height aurora of slow-drifting brand orbs behind a
 * frosted-glass panel. The most kinetic of the three layouts.
 */
export function ModernLayout({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  return (
    <CardShell model={model} className="relative overflow-hidden">
      {/* Aurora field: three orbs on offset drift cycles. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="card-drift absolute -left-20 -top-24 h-96 w-96 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, var(--brand-primary) 32%, transparent)",
          }}
        />
        <div
          className="card-drift absolute right-[-18%] top-20 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, var(--brand-accent) 26%, transparent)",
            animationDuration: "20s",
            animationDelay: "-7s",
          }}
        />
        <div
          className="card-drift absolute bottom-[-12%] left-1/4 h-80 w-80 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, var(--brand-secondary) 22%, transparent)",
            animationDuration: "24s",
            animationDelay: "-13s",
          }}
        />
      </div>

      <main className="relative mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-5 sm:py-10">
        <div className="card-enter flex items-center justify-between gap-3">
          <BrandLogo model={model} />
          <span
            className="rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-accent) 65%, var(--brand-primary)))",
            }}
          >
            Digital card
          </span>
        </div>

        {/* Frosted glass panel floating over the aurora. */}
        <div
          className="card-enter depth-panel overflow-hidden rounded-[calc(var(--brand-card-radius)+4px)] border p-5 backdrop-blur-xl"
          style={
            {
              "--enter-delay": "0.08s",
              background:
                "color-mix(in srgb, var(--brand-surface) 82%, transparent)",
              borderColor: "rgb(255 255 255 / 0.45)",
            } as CSSProperties
          }
        >
          <div className="mb-5 flex justify-center">
            <div
              className="rounded-[1.4rem] p-[3px]"
              style={{
                background:
                  "linear-gradient(140deg, var(--brand-primary), var(--brand-accent), var(--brand-secondary))",
              }}
            >
              <div className="card-sheen h-24 w-24 overflow-hidden rounded-[1.25rem] shadow-md">
                <ProfileImage model={model} />
              </div>
            </div>
          </div>
          <IdentityBlock model={model} />
          <div className="mt-5 space-y-3">
            <CardActionBar model={model} absoluteCardUrl={absoluteCardUrl} />
            <PrimaryCta model={model} />
            <ContactActionRow model={model} />
          </div>
        </div>

        <div
          className="card-enter flex flex-col gap-6"
          style={{ "--enter-delay": "0.16s" } as CSSProperties}
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
