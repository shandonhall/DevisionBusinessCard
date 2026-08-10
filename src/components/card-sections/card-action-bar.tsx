"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, Download, QrCode, Share2, X } from "lucide-react";
import type { PublicCardViewModel } from "@/types/card";
import { QrCodeBlock } from "@/components/cards/qr-code-block";

export function CardActionBar({
  model,
  absoluteCardUrl,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const titleId = useId();
  const vcardUrl = `/api/vcard/${model.organisation.slug}/${model.card.slug}`;
  const qrPageUrl = `${model.card.publicPath}/qr`;
  const isPublic = model.card.publicStatus === "active";

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: model.employee.displayName,
          text: `${model.employee.displayName} · ${model.brand?.name || model.organisation.name}`,
          url: absoluteCardUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteCardUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <a
        href={vcardUrl}
        className="card-lift flex w-full items-center justify-center gap-2 rounded-[var(--brand-button-radius)] px-4 py-3 text-sm font-medium text-white"
        style={{
          background:
            "linear-gradient(180deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 80%, black))",
          boxShadow:
            "0 8px 20px -10px color-mix(in srgb, var(--brand-primary) 55%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.22)",
        }}
      >
        <Download size={18} aria-hidden />
        Save contact
      </a>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="card-lift inline-flex items-center justify-center gap-1.5 rounded-[var(--brand-button-radius)] border px-2 py-2.5 text-xs font-medium"
          style={{
            background: "var(--brand-surface)",
            borderColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
            boxShadow: "0 1px 2px rgb(10 15 12 / 0.05)",
          }}
        >
          <Share2 size={15} aria-hidden />
          Share
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="card-lift inline-flex items-center justify-center gap-1.5 rounded-[var(--brand-button-radius)] border px-2 py-2.5 text-xs font-medium"
          style={{
            background: "var(--brand-surface)",
            borderColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
            boxShadow: "0 1px 2px rgb(10 15 12 / 0.05)",
          }}
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="card-lift inline-flex items-center justify-center gap-1.5 rounded-[var(--brand-button-radius)] border px-2 py-2.5 text-xs font-medium"
          style={{
            background: "var(--brand-surface)",
            borderColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
            boxShadow: "0 1px 2px rgb(10 15 12 / 0.05)",
          }}
        >
          <QrCode size={15} aria-hidden />
          QR
        </button>
      </div>

      {qrOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setQrOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-[calc(var(--brand-card-radius)+4px)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight"
                  style={{ fontFamily: "var(--brand-heading-font)" }}
                >
                  Scan QR code
                </h2>
                <p className="text-sm" style={{ color: "var(--brand-muted-text)" }}>
                  {model.employee.displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="rounded-full p-1.5 text-[var(--brand-muted-text)] hover:bg-black/5"
                aria-label="Close QR code"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mx-auto flex w-fit rounded-[var(--brand-card-radius)] bg-white p-4">
              <QrCodeBlock
                value={absoluteCardUrl}
                size={220}
                title={`QR code for ${model.employee.displayName}`}
              />
            </div>

            {!isPublic ? (
              <p className="mt-3 text-center text-xs text-amber-700 dark:text-amber-300">
                Card is not public yet — scanners will only work after publish.
              </p>
            ) : (
              <p className="mt-3 text-center text-xs" style={{ color: "var(--brand-muted-text)" }}>
                Raise brightness for a cleaner scan.
              </p>
            )}

            {isPublic ? (
              <a
                href={qrPageUrl}
                className="mt-4 block text-center text-sm font-medium underline-offset-4 hover:underline"
                style={{ color: "var(--brand-primary)" }}
              >
                Open full-screen QR
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
