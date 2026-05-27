import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { financialEntries, companies } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { FinancialTabs } from "./financial-tabs";
import type { EntryRow } from "./entry-list";

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function FinancialsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [allEntries, companyList] = await Promise.all([
    db
      .select({
        id: financialEntries.id,
        type: financialEntries.type,
        clientId: financialEntries.clientId,
        description: financialEntries.description,
        amountCents: financialEntries.amountCents,
        date: financialEntries.date,
        dueDate: financialEntries.dueDate,
        paidAt: financialEntries.paidAt,
        recurringPeriod: financialEntries.recurringPeriod,
        notes: financialEntries.notes,
        clientName: companies.name,
      })
      .from(financialEntries)
      .leftJoin(companies, eq(financialEntries.clientId, companies.id))
      .where(isNull(financialEntries.deletedAt))
      .orderBy(financialEntries.date),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
  ]);

  // Serialize timestamps to date strings for client props
  const toRow = (e: typeof allEntries[number]): EntryRow => ({
    ...e,
    paidAt: e.paidAt ? (e.paidAt as Date).toISOString().split("T")[0] : null,
    recurringPeriod: e.recurringPeriod ?? null,
    clientName: e.clientName ?? null,
  });

  const revenueRows = allEntries
    .filter((e) => e.type === "revenue")
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(toRow);

  const cashRows = allEntries
    .filter((e) => e.type === "cash_on_hand")
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(toRow);

  const recurringRows = allEntries
    .filter((e) => e.type === "recurring_cost")
    .sort((a, b) => a.description.localeCompare(b.description))
    .map(toRow);

  const arRows = allEntries
    .filter((e) => e.type === "ar_item")
    .sort((a, b) => {
      // Outstanding first, then by date
      const aPaid = !!(a.paidAt);
      const bPaid = !!(b.paidAt);
      if (aPaid !== bPaid) return aPaid ? 1 : -1;
      return a.date.localeCompare(b.date);
    })
    .map(toRow);

  // Summary computations
  const currentCash = cashRows[0]?.amountCents ?? null;

  const monthlyRecurringCents = recurringRows.reduce((sum, r) => {
    if (r.recurringPeriod === "monthly") return sum + r.amountCents;
    if (r.recurringPeriod === "quarterly") return sum + Math.round(r.amountCents / 3);
    if (r.recurringPeriod === "annual") return sum + Math.round(r.amountCents / 12);
    return sum; // one_time: not a recurring monthly cost
  }, 0);

  const outstandingArCents = arRows
    .filter((r) => !r.paidAt)
    .reduce((sum, r) => sum + r.amountCents, 0);

  const now = new Date();
  const mtdStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mtdRevenueCents = revenueRows
    .filter((r) => r.date >= mtdStart)
    .reduce((sum, r) => sum + r.amountCents, 0);

  const summaryCards = [
    { label: "Cash on Hand", value: currentCash !== null ? formatDollars(currentCash) : "—", sub: cashRows[0]?.date ? `as of ${cashRows[0].date}` : undefined },
    { label: "Monthly Recurring", value: formatDollars(monthlyRecurringCents), sub: undefined },
    { label: "Outstanding AR", value: formatDollars(outstandingArCents), sub: `${arRows.filter((r) => !r.paidAt).length} open` },
    { label: "MTD Revenue", value: formatDollars(mtdRevenueCents), sub: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}` },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-xl font-semibold">Financials</h1>

      {/* Summary header */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="border rounded-lg p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
            {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabbed entry UI */}
      <FinancialTabs
        revenueRows={revenueRows}
        cashRows={cashRows}
        recurringRows={recurringRows}
        arRows={arRows}
        companies={companyList}
      />
    </div>
  );
}
