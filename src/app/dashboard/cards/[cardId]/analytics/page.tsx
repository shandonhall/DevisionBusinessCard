import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import {
  countByEventType,
  countBySource,
  getCardAnalytics,
  seriesByDay,
} from "@/lib/db/analytics";
import { getCardPreviewForAdmin } from "@/lib/db/cards";
import { resolveAnalyticsRange } from "@/lib/analytics/range";
import {
  actionRows,
  AnalyticsMetricGrid,
  AnalyticsRangeNav,
  SimpleBars,
  sourceRows,
} from "@/components/admin/analytics-overview";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ range?: string }>;
};

export default async function CardAnalyticsPage({ params, searchParams }: Props) {
  const { cardId } = await params;
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");
  await requireOrganisationAdmin(organisation.id);

  const model = await getCardPreviewForAdmin({
    organisationId: organisation.id,
    cardId,
  });
  if (!model) notFound();

  const range = resolveAnalyticsRange((await searchParams).range);
  const { overview, events } = await getCardAnalytics(
    organisation.id,
    cardId,
    range,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-[var(--brand-muted-text)]">
            <Link href="/dashboard/analytics" className="underline-offset-4 hover:underline">
              Analytics
            </Link>
            {" / "}
            <Link href="/dashboard/cards" className="underline-offset-4 hover:underline">
              Cards
            </Link>
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {model.employee.displayName}
          </h1>
          <p className="text-[var(--brand-muted-text)]">
            Individual card engagement. Not sales or revenue.
          </p>
        </div>
        <AnalyticsRangeNav
          current={range.preset}
          hrefFor={(preset) =>
            `/dashboard/cards/${cardId}/analytics?range=${preset}`
          }
        />
      </div>

      <AnalyticsMetricGrid overview={overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Source</h2>
          <SimpleBars rows={sourceRows(countBySource(events))} />
        </section>
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Actions</h2>
          <SimpleBars rows={actionRows(countByEventType(events))} />
        </section>
      </div>

      <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold">Trend</h2>
        <ul className="space-y-2 text-sm">
          {seriesByDay(events).map((day) => (
            <li key={day.date} className="flex flex-wrap gap-x-4">
              <span className="w-28 text-[var(--brand-muted-text)]">{day.date}</span>
              <span>{day.views} views</span>
              <span>{day.engaged} engaged</span>
              <span>{day.highIntent} high-intent</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
