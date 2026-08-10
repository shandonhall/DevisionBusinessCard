"use client";

import Link from "next/link";
import type { PublicCardViewModel } from "@/types/card";
import { BrandLogo, CardShell } from "@/components/card-sections/primitives";
import { QrCodeBlock } from "@/components/cards/qr-code-block";

export function QrShareView({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  return (
    <CardShell model={model} className="relative overflow-hidden">
      <div
        aria-hidden
        className="card-drift pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
        }}
      />
      <main className="card-enter relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <BrandLogo model={model} />
        <div className="space-y-1">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--brand-heading-font)" }}
          >
            {model.employee.displayName}
          </h1>
          <p style={{ color: "var(--brand-muted-text)" }}>
            {model.brand?.name || model.organisation.name}
          </p>
        </div>

        <div
          className="rounded-[calc(var(--brand-card-radius)+3px)] p-[3px]"
          style={{
            background:
              "linear-gradient(140deg, var(--brand-primary), var(--brand-accent))",
          }}
        >
          <div className="depth-panel flex items-center justify-center rounded-[var(--brand-card-radius)] bg-white p-5">
            <QrCodeBlock
              value={absoluteCardUrl}
              size={220}
              title={`QR code for ${model.employee.displayName}`}
            />
          </div>
        </div>

        <p className="max-w-xs text-sm" style={{ color: "var(--brand-muted-text)" }}>
          Scan to open this digital business card. For best results, raise screen
          brightness.
        </p>

        <Link
          href={model.card.publicPath}
          className="text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--brand-primary)" }}
        >
          Back to card
        </Link>
      </main>
    </CardShell>
  );
}
