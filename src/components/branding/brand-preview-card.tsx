"use client";

import type { DesignTokens } from "@/lib/branding/tokens";
import { tokensToCssVars } from "@/lib/branding/tokens";

/**
 * Shared preview shell used by the brand editor.
 * Later public card layouts should consume the same token CSS variables.
 */
export function BrandPreviewCard({
  organisationName,
  tokens,
}: {
  organisationName: string;
  tokens: DesignTokens;
}) {
  return (
    <div
      className="depth-panel mx-auto w-full max-w-[320px] overflow-hidden rounded-[1.5rem] border border-[var(--brand-border)]"
      style={tokensToCssVars(tokens)}
    >
      <div
        className="min-h-[540px] p-5"
        style={{
          background: tokens.background,
          color: tokens.text,
          fontFamily: `var(--brand-body-font)`,
        }}
      >
        <div className="mb-6 flex min-h-8 items-center">
          {tokens.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokens.logoUrl}
              alt={`${organisationName} logo`}
              className="max-h-8 max-w-[140px] object-contain"
            />
          ) : (
            <p
              className="text-sm font-semibold tracking-tight"
              style={{
                color: tokens.primary,
                fontFamily: "var(--brand-heading-font)",
              }}
            >
              {organisationName}
            </p>
          )}
        </div>

        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div
            className="rounded-full p-[3px]"
            style={{
              background: `linear-gradient(140deg, ${tokens.primary}, ${tokens.accent})`,
            }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] text-xl font-semibold text-white"
              style={{ background: tokens.primary, borderColor: tokens.surface }}
              aria-hidden
            >
              JD
            </div>
          </div>
          <div>
            <h3
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--brand-heading-font)" }}
            >
              Jane Doe
            </h3>
            <p style={{ color: tokens.mutedText }}>Head of Partnerships</p>
            <p className="text-sm" style={{ color: tokens.mutedText }}>
              {organisationName}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mb-3 flex w-full items-center justify-center rounded-[var(--brand-button-radius)] px-4 py-3 text-sm font-medium text-white"
          style={{ background: tokens.primary }}
        >
          Save contact
        </button>

        <div className="grid grid-cols-2 gap-2">
          {["Call", "Email", "WhatsApp", "Website"].map((label) => (
            <div
              key={label}
              className="rounded-[var(--brand-button-radius)] border px-3 py-3 text-center text-sm"
              style={{
                background: tokens.surface,
                borderColor: `${tokens.primary}33`,
                color: tokens.text,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <p
          className="mt-5 text-center text-xs capitalize"
          style={{ color: tokens.mutedText }}
        >
          Layout: {tokens.layoutId}
        </p>
      </div>
    </div>
  );
}
