"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  Share2,
  X,
} from "lucide-react";
import type { PublicCardViewModel } from "@/types/card";
import { QrCodeBlock } from "@/components/cards/qr-code-block";
import type { AnalyticsTracker } from "@/lib/analytics/types";
import { publicVCardPath, withAttribution } from "@/lib/analytics/source";

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

/**
 * Premium automotive control dock - Save Contact primary, then tactility grid.
 * Same action contracts as Dimension / legacy layouts.
 */
export function DriveContactDock({
  model,
  absoluteCardUrl,
  websiteOverride,
  tracker,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
  websiteOverride?: string | null;
  tracker?: AnalyticsTracker;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const titleId = useId();
  const vcardUrl = publicVCardPath(
    model.organisation.slug,
    model.card.slug,
    tracker,
  );
  const qrPageUrl = `${model.card.publicPath}/qr`;
  const isPublic = model.card.publicStatus === "active";
  const website =
    websiteOverride || model.brand?.website || model.organisation.website;
  const shareUrl = withAttribution(absoluteCardUrl, "shared");
  const qrUrl = withAttribution(absoluteCardUrl, "qr");

  const quick = [
    model.employee.mobile
      ? { key: "call", label: "Call", href: `tel:${model.employee.mobile}`, Icon: Phone }
      : null,
    model.employee.whatsapp
      ? {
          key: "whatsapp",
          label: "WhatsApp",
          href: whatsappHref(model.employee.whatsapp),
          Icon: MessageCircle,
        }
      : null,
    model.employee.email
      ? {
          key: "email",
          label: "Email",
          href: `mailto:${model.employee.email}`,
          Icon: Mail,
        }
      : null,
    website
      ? {
          key: "website",
          label: "Website",
          href: website,
          Icon: Globe,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    Icon: typeof Phone;
  }[];

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  async function handleShare() {
    tracker?.track({ eventType: "share_click" });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: model.employee.displayName,
          text: `${model.employee.displayName} · ${model.organisation.name}`,
          url: shareUrl,
        });
        return;
      } catch {
        // cancelled
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      tracker?.track({ eventType: "copy_link" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="drive-dock">
      {isPublic ? (
        <a
          href={vcardUrl}
          className="drive-dock__save"
          download
          onClick={() => tracker?.track({ eventType: "save_contact" })}
        >
          <Download className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />
          Save Contact
        </a>
      ) : (
        <span className="drive-dock__save drive-dock__save--disabled">
          <Download className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />
          Save Contact
        </span>
      )}

      <div className="drive-console">
        <div className="drive-console__rim" aria-hidden />
        {quick.length > 0 ? (
          <div className="drive-dock__grid">
            {quick.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                className="drive-dock__btn"
                onClick={() => {
                  if (key === "call") tracker?.track({ eventType: "call_click" });
                  if (key === "whatsapp") {
                    tracker?.track({ eventType: "whatsapp_click" });
                  }
                  if (key === "email") {
                    tracker?.track({ eventType: "email_click" });
                  }
                  if (key === "website") {
                    tracker?.track({ eventType: "website_click" });
                  }
                }}
                {...(key === "website"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.55} aria-hidden />
                <span>{label}</span>
              </a>
            ))}
          </div>
        ) : null}

        <div className="drive-dock__grid drive-dock__grid--secondary">
          <button type="button" className="drive-dock__btn" onClick={handleShare}>
            <Share2 className="size-[1.15rem]" strokeWidth={1.55} aria-hidden />
            <span>Share</span>
          </button>
          <button type="button" className="drive-dock__btn" onClick={copyLink}>
            {copied ? (
              <Check className="size-[1.15rem]" strokeWidth={1.55} aria-hidden />
            ) : (
              <Copy className="size-[1.15rem]" strokeWidth={1.55} aria-hidden />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            className="drive-dock__btn"
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="size-[1.15rem]" strokeWidth={1.55} aria-hidden />
            <span>QR</span>
          </button>
        </div>
      </div>

      {qrOpen ? (
        <div
          className="drive-qr-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="drive-qr-modal__backdrop"
            aria-label="Close QR"
            onClick={() => setQrOpen(false)}
          />
          <div className="drive-qr-modal__panel">
            <div className="drive-qr-modal__head">
              <h2 id={titleId} className="drive-qr-modal__title">
                Scan to open card
              </h2>
              <button
                type="button"
                className="drive-qr-modal__close"
                aria-label="Close"
                onClick={() => setQrOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="drive-qr-modal__code">
              <QrCodeBlock value={qrUrl} size={200} />
            </div>
            <a href={qrPageUrl} className="drive-qr-modal__link">
              Open fullscreen QR
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
