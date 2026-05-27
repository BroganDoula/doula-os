import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { hoursEntries, engagements } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { HoursForm } from "./hours-form";
import { HoursList } from "./hours-list";

function getWeekBounds(today: Date) {
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
  };
}

export default async function HoursPage({
  searchParams,
}: {
  searchParams: Promise<{ engagementId?: string; from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const filters = await searchParams;
  const today = new Date();
  const week = getWeekBounds(today);
  const todayStr = today.toISOString().split("T")[0];

  const filterFrom = filters.from ?? week.from;
  const filterTo = filters.to ?? week.to;
  const filterEngagementId = filters.engagementId ?? "";

  const logConditions = [
    filterFrom ? gte(hoursEntries.date, filterFrom) : undefined,
    filterTo ? lte(hoursEntries.date, filterTo) : undefined,
    filterEngagementId ? eq(hoursEntries.engagementId, filterEngagementId) : undefined,
  ].filter((c): c is SQL => c !== undefined);

  const [rows, allEngagements, weekRows] = await Promise.all([
    db
      .select({
        id: hoursEntries.id,
        date: hoursEntries.date,
        hours: hoursEntries.hours,
        type: hoursEntries.type,
        notes: hoursEntries.notes,
        engagementId: hoursEntries.engagementId,
        engagementName: engagements.name,
      })
      .from(hoursEntries)
      .leftJoin(engagements, eq(hoursEntries.engagementId, engagements.id))
      .where(logConditions.length > 0 ? and(...logConditions) : undefined)
      .orderBy(hoursEntries.date),
    db
      .select({
        id: engagements.id,
        name: engagements.name,
        status: engagements.status,
        weeklyHourCommitment: engagements.weeklyHourCommitment,
      })
      .from(engagements)
      .where(isNull(engagements.deletedAt))
      .orderBy(engagements.name),
    db
      .select({ engagementId: hoursEntries.engagementId, hours: hoursEntries.hours })
      .from(hoursEntries)
      .where(and(gte(hoursEntries.date, week.from), lte(hoursEntries.date, week.to))),
  ]);

  const weeklyActuals: Record<string, number> = {};
  for (const r of weekRows) {
    if (r.engagementId) {
      weeklyActuals[r.engagementId] = (weeklyActuals[r.engagementId] ?? 0) + r.hours;
    }
  }

  const activeEngagements = allEngagements.filter((e) => e.status === "active");

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-xl font-semibold">Hours</h1>

      <HoursForm engagements={allEngagements} today={todayStr} />

      {/* Weekly commitment vs actual */}
      {activeEngagements.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">
            This week <span className="text-muted-foreground font-normal">({week.from} — {week.to})</span>
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Engagement</th>
                <th className="pb-2 font-medium text-right">Committed</th>
                <th className="pb-2 font-medium text-right">Actual</th>
                <th className="pb-2 font-medium text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {activeEngagements.map((e) => {
                const actual = weeklyActuals[e.id] ?? 0;
                const committed = e.weeklyHourCommitment ?? 0;
                const delta = actual - committed;
                const hasCommitment = committed > 0;
                return (
                  <tr key={e.id} className="border-b">
                    <td className="py-1.5">{e.name}</td>
                    <td className="py-1.5 text-right text-muted-foreground">
                      {hasCommitment ? committed : "—"}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {actual > 0 ? actual.toFixed(1) : "—"}
                    </td>
                    <td className={`py-1.5 text-right font-medium ${
                      !hasCommitment ? "text-muted-foreground"
                        : delta >= 0 ? "text-green-600"
                        : "text-red-500"
                    }`}>
                      {hasCommitment
                        ? (delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Filterable log */}
      <section className="space-y-4">
        <form method="GET" className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Engagement</label>
            <select
              name="engagementId"
              defaultValue={filterEngagementId}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All</option>
              {allEngagements.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">From</label>
            <input
              name="from"
              type="date"
              defaultValue={filterFrom}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">To</label>
            <input
              name="to"
              type="date"
              defaultValue={filterTo}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline" size="sm">Filter</Button>
            <a href="/hours" className="text-sm text-muted-foreground hover:text-foreground">Reset</a>
          </div>
        </form>

        <HoursList rows={rows} engagements={allEngagements} today={todayStr} />
      </section>
    </div>
  );
}
