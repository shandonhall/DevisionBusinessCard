export type AnalyticsRangePreset = "7d" | "30d" | "month";

export function resolveAnalyticsRange(preset: string | undefined): {
  preset: AnalyticsRangePreset;
  from: string;
  to: string;
  label: string;
} {
  const now = new Date();
  const to = now.toISOString();
  if (preset === "month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return {
      preset: "month",
      from: from.toISOString(),
      to,
      label: "Current month",
    };
  }
  if (preset === "7d") {
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { preset: "7d", from: from.toISOString(), to, label: "Last 7 days" };
  }
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { preset: "30d", from: from.toISOString(), to, label: "Last 30 days" };
}
