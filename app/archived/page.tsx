import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contracts, ndas, engagements, financialEntries, companies } from "@/db/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { ArchivedTabs } from "./archived-tabs";

export default async function ArchivedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [contractRows, ndaRows, projectRows, financialRows] = await Promise.all([
    db
      .select({
        id: contracts.id,
        fileName: contracts.fileName,
        signedDate: contracts.signedDate,
        valueCents: contracts.valueCents,
        deletedAt: contracts.deletedAt,
        companyName: companies.name,
        engagementName: engagements.name,
      })
      .from(contracts)
      .leftJoin(companies, eq(contracts.companyId, companies.id))
      .leftJoin(engagements, eq(contracts.engagementId, engagements.id))
      .where(isNotNull(contracts.deletedAt))
      .orderBy(desc(contracts.deletedAt)),

    db
      .select({
        id: ndas.id,
        counterparty: ndas.counterparty,
        signedDate: ndas.signedDate,
        expirationDate: ndas.expirationDate,
        bidirectional: ndas.bidirectional,
        deletedAt: ndas.deletedAt,
        companyName: companies.name,
      })
      .from(ndas)
      .leftJoin(companies, eq(ndas.companyId, companies.id))
      .where(isNotNull(ndas.deletedAt))
      .orderBy(desc(ndas.deletedAt)),

    db
      .select({
        id: engagements.id,
        name: engagements.name,
        phase: engagements.phase,
        status: engagements.status,
        deletedAt: engagements.deletedAt,
        companyName: companies.name,
      })
      .from(engagements)
      .leftJoin(companies, eq(engagements.companyId, companies.id))
      .where(isNotNull(engagements.deletedAt))
      .orderBy(desc(engagements.deletedAt)),

    db
      .select({
        id: financialEntries.id,
        type: financialEntries.type,
        description: financialEntries.description,
        amountCents: financialEntries.amountCents,
        date: financialEntries.date,
        deletedAt: financialEntries.deletedAt,
      })
      .from(financialEntries)
      .where(isNotNull(financialEntries.deletedAt))
      .orderBy(desc(financialEntries.deletedAt)),
  ]);

  // Serialize timestamps for client props
  const toIso = (d: Date | null) => d?.toISOString() ?? "";

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Archived</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Soft-deleted records — restore to make them visible again.
        </p>
      </div>
      <ArchivedTabs
        contracts={contractRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        ndas={ndaRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        projects={projectRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        financials={financialRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
      />
    </div>
  );
}
