import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getPrimaryOrganisation,
  requireAuthContext,
  requireOrganisationAdmin,
} from "@/lib/auth/session";
import {
  countByEventType,
  countBySource,
  getOrganisationAnalytics,
  seriesByDay,
} from "@/lib/db/analytics";
import { listBrands, listEmployees, listLocations } from "@/lib/db/structure";
import { listCards } from "@/lib/db/cards";
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
  searchParams: Promise<{ range?: string }>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const context = await requireAuthContext();
  const organisation = await getPrimaryOrganisation(context);
  if (!organisation) redirect("/dashboard");
  await requireOrganisationAdmin(organisation.id);

  const params = await searchParams;
  const range = resolveAnalyticsRange(params.range);
  const [{ overview, events }, employees, cards, brands, locations] =
    await Promise.all([
      getOrganisationAnalytics(organisation.id, range),
      listEmployees(organisation.id),
      listCards(organisation.id),
      listBrands(organisation.id),
      listLocations(organisation.id),
    ]);

  const employeeName = new Map(
    employees.map((employee) => [
      employee.id,
      employee.display_name || `${employee.first_name} ${employee.last_name}`,
    ]),
  );
  const brandName = new Map(brands.map((brand) => [brand.id, brand.name]));
  const locationName = new Map(
    locations.map((location) => [location.id, location.name]),
  );
  const cardEmployee = new Map(
    cards.map((card) => [card.id, card.employee_id]),
  );

  const topCards = new Map<
    string,
    { views: number; sessions: Set<string>; highIntent: number }
  >();
  for (const event of events) {
    const current = topCards.get(event.card_id) ?? {
      views: 0,
      sessions: new Set<string>(),
      highIntent: 0,
    };
    if (event.event_type === "card_view") current.views += 1;
    current.sessions.add(event.session_id);
    if (
      event.event_type === "save_contact" ||
      event.event_type === "call_click" ||
      event.event_type === "whatsapp_click" ||
      event.event_type === "email_click" ||
      event.event_type === "website_click"
    ) {
      current.highIntent += 1;
    }
    topCards.set(event.card_id, current);
  }

  const ranked = [...topCards.entries()]
    .map(([cardId, stats]) => ({
      cardId,
      name:
        employeeName.get(cardEmployee.get(cardId) ?? "") ||
        "Card",
      views: stats.views,
      sessions: stats.sessions.size,
      highIntent: stats.highIntent,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const byBrand = new Map<string, number>();
  const byLocation = new Map<string, number>();
  for (const event of events) {
    if (event.event_type !== "card_view") continue;
    if (event.brand_id) {
      byBrand.set(event.brand_id, (byBrand.get(event.brand_id) ?? 0) + 1);
    }
    if (event.location_id) {
      byLocation.set(
        event.location_id,
        (byLocation.get(event.location_id) ?? 0) + 1,
      );
    }
  }

  const trend = seriesByDay(events);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-[var(--brand-muted-text)]">
            Engagement and contact intent for {organisation.name}. These are
            not sales, revenue, or ROI figures.
          </p>
        </div>
        <AnalyticsRangeNav
          current={range.preset}
          hrefFor={(preset) => `/dashboard/analytics?range=${preset}`}
        />
      </div>

      <AnalyticsMetricGrid overview={overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Traffic source</h2>
          <SimpleBars rows={sourceRows(countBySource(events))} />
        </section>
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Actions</h2>
          <SimpleBars rows={actionRows(countByEventType(events))} />
        </section>
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Brand views</h2>
          <SimpleBars
            rows={[...byBrand.entries()].map(([id, value]) => ({
              label: brandName.get(id) || "Unassigned",
              value,
            }))}
          />
        </section>
        <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Location views</h2>
          <SimpleBars
            rows={[...byLocation.entries()].map(([id, value]) => ({
              label: locationName.get(id) || "Unassigned",
              value,
            }))}
          />
        </section>
      </div>

      <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold">Trend</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-[var(--brand-muted-text)]">
            No events in {range.label}.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {trend.map((day) => (
              <li key={day.date} className="flex flex-wrap gap-x-4">
                <span className="w-28 text-[var(--brand-muted-text)]">
                  {day.date}
                </span>
                <span>{day.views} views</span>
                <span>{day.engaged} engaged</span>
                <span>{day.highIntent} high-intent</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold">Top cards</h2>
        <ul className="space-y-3">
          {ranked.map((row) => (
            <li key={row.cardId} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-[var(--brand-muted-text)]">
                  {row.views} views · {row.sessions} sessions · {row.highIntent}{" "}
                  high-intent
                </p>
              </div>
              <Link
                href={`/dashboard/cards/${row.cardId}/analytics?range=${range.preset}`}
                className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
              >
                Card detail
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
