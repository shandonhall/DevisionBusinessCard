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
import { SocialLinks } from "@/components/card-sections/primitives";
import type { AnalyticsTracker } from "@/lib/analytics/types";
import { publicVCardPath, withAttribution } from "@/lib/analytics/source";

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

/**
 * Premium contact dock - subordinate to the acrylic identity object.
 * Same vCard / share / QR / tel / mailto contracts as before.
 */
export function DimensionContactInterface({
  model,
  absoluteCardUrl,
  tracker,
}: {
  model: PublicCardViewModel;
  absoluteCardUrl: string;
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
    model.organisation.website || model.brand?.website
      ? {
          key: "website",
          label: "Website",
          href: (model.brand?.website || model.organisation.website)!,
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
          text: `${model.employee.displayName} · ${model.brand?.name || model.organisation.name}`,
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
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="dim-contact mx-auto w-full max-w-[40rem] space-y-7 sm:space-y-9">
      <div className="dim-dock-stack space-y-3 sm:space-y-3.5">
        <a
          href={vcardUrl}
          className="dim-save-cta group"
          onClick={() => tracker?.track({ eventType: "save_contact" })}
        >
          <span className="dim-save-fill" aria-hidden />
          <span className="dim-save-edge" aria-hidden />
          <span className="dim-save-sheen" aria-hidden />
          <Download size={15} className="relative opacity-85" aria-hidden />
          <span className="relative">Save contact</span>
        </a>

        {quick.length > 0 ? (
          <ul
            className={`dim-action-dock ${
              quick.length === 4
                ? "dim-dock-4"
                : quick.length === 3
                  ? "dim-dock-3"
                  : "dim-dock-2"
            }`}
          >
            {quick.map((action) => (
              <li key={action.key}>
                <a
                  href={action.href}
                  className="dim-dock-btn"
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    action.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  onClick={() => {
                    if (action.key === "call") {
                      tracker?.track({ eventType: "call_click" });
                    }
                    if (action.key === "whatsapp") {
                      tracker?.track({ eventType: "whatsapp_click" });
                    }
                    if (action.key === "email") {
                      tracker?.track({ eventType: "email_click" });
                    }
                    if (action.key === "website") {
                      tracker?.track({ eventType: "website_click" });
                    }
                  }}
                >
                  <action.Icon size={15} strokeWidth={1.75} aria-hidden />
                  <span>{action.label}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="dim-share-row">
          <button type="button" onClick={handleShare} className="dim-share-btn">
            <Share2 size={13} aria-hidden />
            Share
          </button>
          <button type="button" onClick={copyLink} className="dim-share-btn">
            <span className={`dim-copy-swap ${copied ? "is-copied" : ""}`}>
              <span className="dim-copy-idle">
                <Copy size={13} aria-hidden />
                Copy
              </span>
              <span className="dim-copy-done">
                <Check size={13} aria-hidden />
                Copied
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="dim-share-btn"
          >
            <QrCode size={13} aria-hidden />
            QR
          </button>
        </div>
      </div>

      {model.employee.bio || model.employee.linkedinUrl ? (
        <section className="dim-editorial mx-auto max-w-md space-y-3.5 px-1 text-center">
          <div className="dim-editorial-rule mx-auto" />
          {model.employee.bio ? (
            <div className="space-y-2">
              <p className="dim-editorial-label">About</p>
              <p className="dim-editorial-body">{model.employee.bio}</p>
            </div>
          ) : null}
          <div className="flex justify-center [&_a]:text-white/50 [&_a:hover]:text-white/80">
            <SocialLinks model={model} />
          </div>
        </section>
      ) : null}

      {qrOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => setQrOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="dim-qr-dialog w-full max-w-sm p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-medium tracking-tight text-white"
                  style={{ fontFamily: "var(--brand-heading-font)" }}
                >
                  Scan QR code
                </h2>
                <p className="text-sm text-white/50">
                  {model.employee.displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="rounded-full p-1.5 text-white/50 hover:bg-white/5 hover:text-white/80"
                aria-label="Close QR code"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mx-auto flex w-fit rounded-xl bg-white p-4">
              <QrCodeBlock
                value={qrUrl}
                size={220}
                title={`QR code for ${model.employee.displayName}`}
              />
            </div>
            {!isPublic ? (
              <p className="mt-3 text-center text-xs text-amber-300/90">
                Card is not public yet - scanners will only work after publish.
              </p>
            ) : (
              <a
                href={qrPageUrl}
                className="mt-4 block text-center text-sm text-white/55 underline-offset-4 hover:text-white/85 hover:underline"
              >
                Open full-screen QR
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
