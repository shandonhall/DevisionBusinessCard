import Link from "next/link";
import type { AnalyticsOverview } from "@/lib/analytics/summarise";
import type { AnalyticsEventType, TrafficSource } from "@/lib/analytics/types";

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function seconds(ms: number) {
  if (!ms) return "0s";
  return `${Math.round(ms / 100) / 10}s`;
}

export function AnalyticsMetricGrid({ overview }: { overview: AnalyticsOverview }) {
  const items = [
    { label: "Card views", value: String(overview.cardViews) },
    { label: "Sessions / visits", value: String(overview.sessions) },
    { label: "Engaged sessions", value: String(overview.engagedSessions) },
    { label: "Engagement rate", value: pct(overview.engagementRate) },
    { label: "Average engaged time", value: seconds(overview.averageEngagedTimeMs) },
    { label: "High-intent actions", value: String(overview.highIntentActions) },
    { label: "Contacts saved", value: String(overview.contactsSaved) },
    { label: "QR-attributed opens", value: String(overview.qrAttributedOpens) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4"
        >
          <p className="text-xs uppercase tracking-wide text-[var(--brand-muted-text)]">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsRangeNav({
  current,
  hrefFor,
}: {
  current: string;
  hrefFor: (preset: string) => string;
}) {
  const options = [
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "month", label: "Current month" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.id}
          href={hrefFor(option.id)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            current === option.id
              ? "bg-[var(--brand-primary)] text-white"
              : "border border-[var(--brand-border-strong)]"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

export function SimpleBars({
  rows,
}: {
  rows: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{row.label}</span>
            <span className="text-[var(--brand-muted-text)]">{row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-hover)]">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)]"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function sourceRows(
  counts: Record<TrafficSource, number>,
): Array<{ label: string; value: number }> {
  return [
    { label: "QR", value: counts.qr },
    { label: "Direct", value: counts.direct },
    { label: "Shared", value: counts.shared },
    { label: "Campaign", value: counts.campaign },
    { label: "Other", value: counts.other },
  ];
}

export function actionRows(
  counts: Partial<Record<AnalyticsEventType, number>>,
): Array<{ label: string; value: number }> {
  return [
    { label: "Save contact", value: counts.save_contact ?? 0 },
    { label: "Call", value: counts.call_click ?? 0 },
    { label: "WhatsApp", value: counts.whatsapp_click ?? 0 },
    { label: "Email", value: counts.email_click ?? 0 },
    { label: "Website", value: counts.website_click ?? 0 },
    { label: "Share", value: counts.share_click ?? 0 },
    { label: "Copy link", value: counts.copy_link ?? 0 },
    { label: "Flip", value: counts.card_flip ?? 0 },
  ];
}
