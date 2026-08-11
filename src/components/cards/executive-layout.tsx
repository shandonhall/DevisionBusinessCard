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

function CardFooter({ model }: { model: PublicCardViewModel }) {
  if (model.organisation.whiteLabelEnabled) return null;
  return (
    <PlatformPoweredBy style={{ color: "var(--brand-muted-text)" }} />
  );
}

/**
 * Executive: a single elevated "sheet" floating over a quiet, brand-tinted
 * atmosphere - like a physical card laid on a desk. Calm depth, one sheen.
 */
export function ExecutiveLayout({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  return (
    <CardShell model={model} className="relative overflow-hidden">
      {/* Atmosphere: soft top wash + drifting accent glow, all token-derived. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 12%, var(--brand-background)), var(--brand-background))",
        }}
      />
      <div
        aria-hidden
        className="card-drift pointer-events-none absolute -top-24 right-[-25%] h-80 w-80 rounded-full blur-3xl"
        style={{
          background: "color-mix(in srgb, var(--brand-accent) 16%, transparent)",
        }}
      />

      <main className="relative mx-auto w-full max-w-md px-4 py-8 sm:px-5 sm:py-10">
        <div
          className="card-enter depth-panel flex flex-col gap-8 rounded-[calc(var(--brand-card-radius)+8px)] border px-5 py-9"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--brand-surface) 97%, var(--brand-primary)), var(--brand-surface) 35%)",
            borderColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
          }}
        >
          <div className="flex justify-center">
            <BrandLogo model={model} />
          </div>

          <div
            className="card-enter flex flex-col items-center gap-5"
            style={{ "--enter-delay": "0.08s" } as CSSProperties}
          >
            {/* Gradient ring + sheen give the portrait a jewel-like finish. */}
            <div
              className="rounded-full p-[3px] shadow-md"
              style={{
                background:
                  "linear-gradient(140deg, var(--brand-primary), var(--brand-accent))",
              }}
            >
              <div
                className="card-sheen h-28 w-28 overflow-hidden rounded-full border-[3px]"
                style={{ borderColor: "var(--brand-surface)" }}
              >
                <ProfileImage model={model} />
              </div>
            </div>
            <IdentityBlock model={model} />
            <div
              aria-hidden
              className="h-px w-16 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--brand-accent), transparent)",
              }}
            />
          </div>

          <div
            className="card-enter flex flex-col gap-4"
            style={{ "--enter-delay": "0.16s" } as CSSProperties}
          >
            <CardActionBar model={model} absoluteCardUrl={absoluteCardUrl} />
            <PrimaryCta model={model} />
            <ContactActionRow model={model} />
          </div>

          <div
            className="card-enter flex flex-col gap-6"
            style={{ "--enter-delay": "0.24s" } as CSSProperties}
          >
            <AboutSection model={model} />
            <SocialLinks model={model} />
          </div>
        </div>
        <CardFooter model={model} />
      </main>
    </CardShell>
  );
}
