import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  companies,
  contacts,
  deals,
  engagements,
  deliverables,
  hoursEntries,
  contracts,
  ndas,
  financialEntries,
} from "@/db/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { ArchivedTabs } from "./archived-tabs";

export default async function ArchivedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [
    companyRows,
    contactRows,
    dealRows,
    projectRows,
    deliverableRows,
    hoursRows,
    contractRows,
    ndaRows,
    financialRows,
  ] = await Promise.all([
    db
      .select({
        id: companies.id,
        name: companies.name,
        website: companies.website,
        deletedAt: companies.deletedAt,
      })
      .from(companies)
      .where(isNotNull(companies.deletedAt))
      .orderBy(desc(companies.deletedAt)),

    db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        role: contacts.role,
        deletedAt: contacts.deletedAt,
        companyName: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(isNotNull(contacts.deletedAt))
      .orderBy(desc(contacts.deletedAt)),

    db
      .select({
        id: deals.id,
        stage: deals.stage,
        dealSizeCents: deals.dealSizeCents,
        deletedAt: deals.deletedAt,
        companyName: companies.name,
      })
      .from(deals)
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .where(isNotNull(deals.deletedAt))
      .orderBy(desc(deals.deletedAt)),

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
        id: deliverables.id,
        title: deliverables.title,
        status: deliverables.status,
        deletedAt: deliverables.deletedAt,
        engagementName: engagements.name,
      })
      .from(deliverables)
      .leftJoin(engagements, eq(deliverables.engagementId, engagements.id))
      .where(isNotNull(deliverables.deletedAt))
      .orderBy(desc(deliverables.deletedAt)),

    db
      .select({
        id: hoursEntries.id,
        date: hoursEntries.date,
        hours: hoursEntries.hours,
        type: hoursEntries.type,
        deletedAt: hoursEntries.deletedAt,
        engagementName: engagements.name,
      })
      .from(hoursEntries)
      .leftJoin(engagements, eq(hoursEntries.engagementId, engagements.id))
      .where(isNotNull(hoursEntries.deletedAt))
      .orderBy(desc(hoursEntries.deletedAt)),

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
        companies={companyRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        contacts={contactRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        deals={dealRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        projects={projectRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        deliverables={deliverableRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        hours={hoursRows.map((r) => ({ ...r, hours: Number(r.hours), deletedAt: toIso(r.deletedAt as Date | null) }))}
        contracts={contractRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        ndas={ndaRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
        financials={financialRows.map((r) => ({ ...r, deletedAt: toIso(r.deletedAt as Date | null) }))}
      />
    </div>
  );
}
